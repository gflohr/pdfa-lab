import {
	DOMImplementation,
	type Document,
	type Element,
	XMLSerializer,
} from '@xmldom/xmldom';
import * as rdflib from 'rdflib';
import formatXML from 'xml-formatter';
import { NS_RDF } from '../xmp/xmp-document.js';

const NS_XML = 'http://www.w3.org/2000/xmlns/';
const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';
const RDF_LANG_STRING = `${NS_RDF}langString`;

interface XmpProperty {
	prefix: string;
	namespaceUri: string;
	name: string;
	value: RdfValue;
}

type RdfValue =
	| { type: 'Literal'; value: string; lang?: string; datatype?: string }
	| { type: 'Struct'; properties: XmpProperty[] }
	| {
			type: 'Bag' | 'Seq' | 'Alt';
			items: RdfValue[];
			properties?: XmpProperty[];
	  }
	| { type: 'Resource'; uri: string }
	| { type: 'NodeRef'; nodeId: string };

const RDF_CONTAINER_TYPES = new Set([
	`${NS_RDF}Alt`,
	`${NS_RDF}Bag`,
	`${NS_RDF}Seq`,
]);

/** @internal */
export class RdfXmlSerialiser {
	constructor(private readonly baseIRI: string) {}

	public serialise(
		store: rdflib.Store,
		prefixMap: Record<string, string>,
	): string {
		const subject = rdflib.sym(this.baseIRI);
		const properties = this.extractXmpProperties(store, subject, {
			[NS_RDF]: 'rdf',
			...prefixMap,
		});

		const aboutUri = '';
		const impl = new DOMImplementation();

		const doc = impl.createDocument(NS_RDF, 'rdf:RDF', null);
		const rootNode = doc.documentElement!;

		const descNode = doc.createElementNS(NS_RDF, 'rdf:Description');
		descNode.setAttributeNS(NS_RDF, 'rdf:about', aboutUri);
		rootNode.appendChild(descNode);

		for (const prop of properties) {
			this.declareNamespace(rootNode, prop.prefix, prop.namespaceUri);
			const propEl = doc.createElementNS(
				prop.namespaceUri,
				`${prop.prefix}:${prop.name}`,
			);
			this.appendRdfValue(doc, rootNode, propEl, prop.value);
			descNode.appendChild(propEl);
		}

		const compact = new XMLSerializer().serializeToString(doc);

		return formatXML(compact, {
			indentation: '\t',
			collapseContent: true,
			lineSeparator: '\n',
		});
	}

	private appendRdfValue(
		doc: Document,
		rootNode: Element,
		parentEl: Element,
		value: RdfValue,
	): void {
		switch (value.type) {
			case 'Literal':
				if (value.lang) {
					parentEl.setAttributeNS(
						'http://www.w3.org/XML/1998/namespace',
						'xml:lang',
						value.lang,
					);
				} else if (value.datatype) {
					parentEl.setAttributeNS(NS_RDF, 'rdf:datatype', value.datatype);
				}
				parentEl.appendChild(doc.createTextNode(value.value));
				break;

			case 'Resource':
				parentEl.setAttributeNS(NS_RDF, 'rdf:resource', value.uri);
				break;

			case 'NodeRef':
				parentEl.setAttributeNS(NS_RDF, 'rdf:nodeID', value.nodeId);
				break;

			case 'Struct':
				parentEl.setAttributeNS(NS_RDF, 'rdf:parseType', 'Resource');
				for (const prop of value.properties) {
					this.declareNamespace(rootNode, prop.prefix, prop.namespaceUri);
					const propEl = doc.createElementNS(
						prop.namespaceUri,
						`${prop.prefix}:${prop.name}`,
					);
					this.appendRdfValue(doc, rootNode, propEl, prop.value);
					parentEl.appendChild(propEl);
				}
				break;

			case 'Bag':
			case 'Seq':
			case 'Alt': {
				const container = doc.createElementNS(NS_RDF, `rdf:${value.type}`);
				for (const item of value.items) {
					const li = doc.createElementNS(NS_RDF, 'rdf:li');
					if (item.type === 'Struct') {
						li.setAttributeNS(NS_RDF, 'rdf:parseType', 'Resource');
						for (const prop of item.properties) {
							this.declareNamespace(rootNode, prop.prefix, prop.namespaceUri);
							const propEl = doc.createElementNS(
								prop.namespaceUri,
								`${prop.prefix}:${prop.name}`,
							);
							this.appendRdfValue(doc, rootNode, propEl, prop.value);
							li.appendChild(propEl);
						}
					} else {
						this.appendRdfValue(doc, rootNode, li, item);
					}
					container.appendChild(li);
				}

				if (value.properties) {
					for (const prop of value.properties) {
						this.declareNamespace(rootNode, prop.prefix, prop.namespaceUri);
						const propEl = doc.createElementNS(
							prop.namespaceUri,
							`${prop.prefix}:${prop.name}`,
						);
						this.appendRdfValue(doc, rootNode, propEl, prop.value);
						container.appendChild(propEl);
					}
				}

				parentEl.appendChild(container);
				break;
			}
		}
	}

	private declareNamespace(
		rootNode: Element,
		prefix: string,
		namespaceUri: string,
	): void {
		const xmlnsAttr = `xmlns:${prefix}`;
		if (!rootNode.hasAttribute(xmlnsAttr)) {
			rootNode.setAttributeNS(NS_XML, xmlnsAttr, namespaceUri);
		}
	}

	/**
	 * Converts rdflib store statements for a subject into a structured XmpProperty[] tree.
	 */
	private extractXmpProperties(
		kb: rdflib.IndexedFormula,
		subject: rdflib.NamedNode | rdflib.BlankNode,
		prefixMap: Record<string, string> = {},
		visitedNodes: Set<string> = new Set(),
	): XmpProperty[] {
		const statements = kb.statementsMatching(subject, null, null);
		const properties: XmpProperty[] = [];

		for (const stmt of statements) {
			const predUri = stmt.predicate.value;

			// Skip structural container markers (rdf:Bag, rdf:Seq, rdf:Alt).
			if (
				predUri === `${NS_RDF}type` &&
				RDF_CONTAINER_TYPES.has(stmt.object.value)
			) {
				continue;
			}

			const { namespaceUri, name, prefix } = this.parseUri(predUri, prefixMap);
			const value = this.extractRdfValue(
				kb,
				stmt.object as rdflib.BlankNode | rdflib.NamedNode | rdflib.Literal,
				prefixMap,
				visitedNodes,
			);

			properties.push({
				prefix,
				namespaceUri,
				name,
				value,
			});
		}

		return properties;
	}

	private extractRdfValue(
		kb: rdflib.IndexedFormula,
		node: rdflib.BlankNode | rdflib.NamedNode | rdflib.Literal,
		prefixMap: Record<string, string>,
		visitedNodes: Set<string> = new Set(),
	): RdfValue {
		if (node.termType === 'Literal') {
			const lang = node.language === '' ? undefined : node.language;

			let datatype: string | undefined;
			if (
				node.datatype &&
				node.datatype.value !== XSD_STRING &&
				node.datatype.value !== RDF_LANG_STRING
			) {
				datatype = node.datatype.value;
			}

			return {
				type: 'Literal',
				value: node.value,
				...(lang ? { lang } : {}),
				...(datatype ? { datatype } : {}),
			};
		}

		if (node.termType === 'NamedNode') {
			return { type: 'Resource', uri: node.value };
		}

		// BlankNode tracking (prevent infinite cycles & duplicate inlining).
		if (node.termType === 'BlankNode') {
			const nodeId = node.value;
			if (visitedNodes.has(nodeId)) {
				return { type: 'NodeRef', nodeId };
			}
			visitedNodes.add(nodeId);
		}

		// Container check (Bag, Seq, Alt).
		const typeNode = kb.any(node, rdflib.sym(`${NS_RDF}type`), null);
		const typeUri = typeNode?.value;
		if (
			typeUri === `${NS_RDF}Bag` ||
			typeUri === `${NS_RDF}Seq` ||
			typeUri === `${NS_RDF}Alt`
		) {
			const containerType = typeUri.replace(NS_RDF, '') as
				| 'Bag'
				| 'Seq'
				| 'Alt';

			const allStmts = kb.statementsMatching(node, null, null);

			// Extract container items in numerical order.
			const itemStmts = allStmts
				.filter((s) => {
					const pred = s.predicate.value;
					return (
						pred.startsWith(`${NS_RDF}_`) &&
						/^\d+$/.test(pred.slice(NS_RDF.length + 1))
					);
				})
				.sort((a, b) => {
					const idxA = parseInt(
						a.predicate.value.replace(`${NS_RDF}_`, ''),
						10,
					);
					const idxB = parseInt(
						b.predicate.value.replace(`${NS_RDF}_`, ''),
						10,
					);
					return idxA - idxB;
				});

			const items = itemStmts.map((s) =>
				this.extractRdfValue(
					kb,
					s.object as rdflib.BlankNode | rdflib.NamedNode | rdflib.Literal,
					prefixMap,
					visitedNodes,
				),
			);

			// Extract non-membership, non-type properties on the container.
			const propStmts = allStmts.filter((s) => {
				const pred = s.predicate.value;
				if (pred === `${NS_RDF}type`) return false;
				if (
					pred.startsWith(`${NS_RDF}_`) &&
					/^\d+$/.test(pred.slice(NS_RDF.length + 1))
				) {
					return false;
				}
				return true;
			});

			const containerProperties: XmpProperty[] = [];
			for (const stmt of propStmts) {
				const { namespaceUri, name, prefix } = this.parseUri(
					stmt.predicate.value,
					prefixMap,
				);
				const value = this.extractRdfValue(
					kb,
					stmt.object as rdflib.BlankNode | rdflib.NamedNode | rdflib.Literal,
					prefixMap,
					visitedNodes,
				);
				containerProperties.push({
					prefix,
					namespaceUri,
					name,
					value,
				});
			}

			return {
				type: containerType,
				items,
				...(containerProperties.length > 0
					? { properties: containerProperties }
					: {}),
			};
		}

		// Fallback struct (inline acyclic blank-node properties).
		const structProperties = this.extractXmpProperties(
			kb,
			node as rdflib.BlankNode,
			prefixMap,
			visitedNodes,
		);

		return {
			type: 'Struct',
			properties: structProperties,
		};
	}

	private parseUri(
		uri: string,
		prefixMap: Record<string, string>,
	): { namespaceUri: string; name: string; prefix: string } {
		// Check against explicitly registered prefix map
		// (namespaceUri -> prefix).
		for (const [nsUri, prefix] of Object.entries(prefixMap)) {
			if (uri.startsWith(nsUri)) {
				const name = uri.slice(nsUri.length);
				if (name.includes('/') || name.includes('#')) {
					continue;
				}

				return {
					namespaceUri: nsUri,
					name: uri.slice(nsUri.length),
					prefix,
				};
			}
		}

		// Fallback delimiter splitting at '#' or last '/'.
		const splitIdx = Math.max(uri.lastIndexOf('#'), uri.lastIndexOf('/'));
		if (splitIdx !== -1) {
			const namespaceUri = uri.slice(0, splitIdx + 1);
			const name = uri.slice(splitIdx + 1);
			const prefix = prefixMap[namespaceUri] || 'ns';
			return { namespaceUri, name, prefix };
		}

		return { namespaceUri: uri, name: uri, prefix: 'ns' };
	}
}
