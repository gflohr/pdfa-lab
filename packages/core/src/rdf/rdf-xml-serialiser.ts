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

interface XmpProperty {
	prefix: string;
	namespaceUri: string;
	name: string;
	value: RdfValue;
}

type RdfValue =
	| { type: 'Literal'; value: string; lang?: string }
	| { type: 'Struct'; properties: XmpProperty[] }
	| { type: 'Bag' | 'Seq' | 'Alt'; items: RdfValue[] }
	| { type: 'Resource'; uri: string };

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

		// Create root <rdf:RDF> element.
		const doc = impl.createDocument(NS_RDF, 'rdf:RDF', null);
		const rootNode = doc.documentElement!;

		// Create <rdf:Description rdf:about="...">.
		const descNode = doc.createElementNS(NS_RDF, 'rdf:Description');
		descNode.setAttributeNS(NS_RDF, 'rdf:about', aboutUri);
		rootNode.appendChild(descNode);

		// Append root properties.
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
				if (typeof value.lang === 'string') {
					parentEl.setAttribute('xml:lang', value.lang);
				}
				parentEl.appendChild(doc.createTextNode(value.value));
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
						// Flatten struct directly into <rdf:li rdf:parseType="Resource">
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
				parentEl.appendChild(container);
				break;
			}

			case 'Resource':
				parentEl.setAttributeNS(NS_RDF, 'rdf:resource', value.uri);
				break;
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
		subject: rdflib.NamedNode,
		prefixMap: Record<string, string> = {},
	): XmpProperty[] {
		const statements = kb.statementsMatching(subject, null, null);
		const properties: XmpProperty[] = [];

		for (const stmt of statements) {
			const predUri = stmt.predicate.value;

			// Skip internal rdf:type predicate on the property list
			if (
				predUri === `${NS_RDF}type` &&
				RDF_CONTAINER_TYPES.has(stmt.object.value)
			) {
				continue;
			}

			const { namespaceUri, name, prefix } = this.parseUri(predUri, prefixMap);
			const value = this.extractRdfValue(
				kb,
				stmt.object as rdflib.BlankNode,
				prefixMap,
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
	): RdfValue {
		// 1. Literal node
		if (node.termType === 'Literal') {
			const lang = node.language === '' ? undefined : node.language;
			return { type: 'Literal', value: node.value, lang };
		}

		// 2. Resource / NamedNode reference (e.g. rdf:type targets)
		if (node.termType === 'NamedNode') {
			return { type: 'Resource', uri: node.value };
		}

		// 3. Container check (Bag, Seq, Alt)
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

			// Extract container items (rdf:_1, rdf:_2, ...) in numerical order
			const itemStmts = kb
				.statementsMatching(node, null, null)
				.filter((s) => s.predicate.value.startsWith(`${NS_RDF}_`))
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
				this.extractRdfValue(kb, s.object as rdflib.BlankNode, prefixMap),
			);

			return {
				type: containerType,
				items,
			};
		}

		// 4. Struct node (fallback for any node containing child properties)
		const structProperties = this.extractXmpProperties(
			kb,
			node as unknown as rdflib.NamedNode,
			prefixMap,
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
		// 1. Check against explicitly registered prefix map (namespaceUri -> prefix)
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

		// 2. Fallback delimiter splitting at '#' or last '/'
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
