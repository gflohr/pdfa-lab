import {
	DOMParser,
	type Document,
	type Element,
	Node,
	XMLSerializer,
} from '@xmldom/xmldom';
import * as rdflib from 'rdflib';
import type { PredicateType, SubjectType } from 'rdflib/lib/types.js';
import { dublinCoreSchema } from './schemas/dublin-core.js';
import { pdfaExtensionSchema } from './schemas/pdfa-extension.js';
import { xmpSchema } from './schemas/xmp.js';
import { xmpMediaManagementSchema } from './schemas/xmp-media-management.js';
import { parsePath } from './util/parse-path.js';
import type { XmpSchema } from './xmp-schema.js';
import { RdfProperty, RdfValueType } from '../rdf/rdf-schema.js';

/**
 * Default base IRI.
 */
export const DEFAULT_BASE_IRI = 'urn:xmp:doc';

/**
 * Output formats.
 */
/** Union of all valid key aliases ('xml' | 'html' | 'turtle' | ...) */
export type RdfSerialisationFormat =
	| 'application/rdf+xml'
	| 'text/turtle'
	| 'application/n-triples'
	| 'application/ld+json'
	| 'text/n3'
	| 'application/nquads';

export const rdfSerialisationFormatAlias: Record<
	string,
	RdfSerialisationFormat
> = {
	'application/x-turtle': 'text/turtle',
	'application/n3': 'text/n3',
	'application/n-quads': 'application/nquads',
};

export type RdfSerialisationFormatAlias =
	keyof typeof rdfSerialisationFormatAlias;

/**
 * Serialisation options.
 */
export interface RdfSerialisationOptions {
	/**
	 * Common flags used internally (you can combine them, e.g. 'o k'):
	 *
	 * * s i – used by default for Turtle to suppress =, => notations
	 * * d e i n p r s t u x – used for N-Triples/N-Quads to simplify output
	 * * dr – used with JSON‑LD conversion (no default, no relative prefix)
	 * o – new: do not abbreviate to a prefixed name when the local part contains a dot. This keeps IRIs like http://example.org/ns/subject.example in <...> form instead of ns:subject.example.
	 *
	 * Notes:
	 *
	 * For Turtle and JSON‑LD, user‑provided flags are merged with the defaults so your flags (like o) are honored.
	 * By contrast, passing 'p' disables prefix abbreviations entirely (all terms are written as <...> IRIs).
	 */
	flags?: string;
}

/** Localised strings (e.g., alt text, titles in rdf:Alt) */
export type XmpLangAlt = Record<string, string>; // e.g., { 'x-default': 'Title', 'de-DE': 'Titel' }

/** Primitives supported in XMP fields */
export type XmpValue =
	| string
	| number
	| boolean
	| XmpLangAlt
	| XmpValue[]
	| { [key: string]: XmpValue };

/**
 * Options for setMetaInfo().
 */
export interface XMPSetMetaInfoOptions {
	/**
	 * Keep existing value? Default `false`.
	 */
	noOverwrite?: boolean;

	/**
	 * Append item to Bag/Seq? Ignored for other types. Default `false`.
	 */
	append?: boolean;
}

const bom = '\uFEFF';

const NS_RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';

const RDF = rdflib.Namespace(NS_RDF);

/** @internal */
export class XmpDocument {
	/** @internal */
	public static readonly NS_X = 'adobe:ns:meta/';

	private doc: Document;
	private kb = rdflib.graph();
	private schemas: Record<string, XmpSchema> = {};
	private namespaces: Record<string, string> = {};

	constructor(
		xmlString?: string,
		private readonly baseIRI = DEFAULT_BASE_IRI,
	) {
		if (!xmlString || xmlString.trim() === '') {
			xmlString = XmpDocument.createEmptyXmpMeta();
		}

		this.doc = new DOMParser().parseFromString(xmlString, 'text/xml');

		const relevantNodes: Node[] = [];
		for (const node of this.doc.childNodes) {
			if (
				node.nodeType === Node.ELEMENT_NODE ||
				node.nodeType === Node.PROCESSING_INSTRUCTION_NODE
			) {
				relevantNodes.push(node);
			} else if (
				node.nodeType === Node.TEXT_NODE &&
				node.textContent?.trim() !== ''
			) {
				// This is an error.
				relevantNodes.push(node);
			}
		}

		let xmpMeta: Element;
		if (
			relevantNodes.length !== 3 ||
			relevantNodes[0]?.nodeType !== Node.PROCESSING_INSTRUCTION_NODE ||
			relevantNodes[0]?.nodeName !== 'xpacket' ||
			!this.isXmpMetaElement(relevantNodes[1] as unknown as Element)
		) {
			xmlString = XmpDocument.createEmptyXmpMeta();
			this.doc = new DOMParser().parseFromString(xmlString, 'text/xml');
			xmpMeta = this.doc.childNodes[2] as unknown as Element;
		} else {
			xmpMeta = relevantNodes[1]! as unknown as Element;
		}

		const rdfElement = this.getOrCreateRdfElement(xmpMeta);
		xmlString = new XMLSerializer().serializeToString(rdfElement);

		rdflib.parse(xmlString, this.kb, baseIRI, 'application/rdf+xml');

		this.registerNamespace('dc', dublinCoreSchema);
		this.registerNamespace('xmp', xmpSchema);
		this.registerNamespace('xmpMM', xmpMediaManagementSchema);

		this.registerNamespace('pdfaExtension', pdfaExtensionSchema);
	}

	private static createEmptyXmpMeta(): string {
		const bom = '\uFEFF';

		return `<?xpacket begin="${bom}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="${XmpDocument.NS_X}">
</x:xmpmeta>
<?xpacket end="w"?>`;
	}

	private isXmpMetaElement(elem?: Element): boolean {
		if (!elem || elem.nodeType !== Node.ELEMENT_NODE || !elem.attributes) {
			return false;
		}

		let xmpMetaPrefix: string | undefined;
		const attributes = elem.attributes;
		for (let i = 0; i < attributes.length; ++i) {
			const attr = attributes.item(i);
			if (!attr?.name.startsWith('xmlns:') || attr?.name.length <= 6) continue;
			if (attr.value !== 'adobe:ns:meta/') continue;
			xmpMetaPrefix = attr.name.slice(6);
		}

		if (typeof xmpMetaPrefix === 'undefined') return false;

		if (elem.nodeName !== `${xmpMetaPrefix}:xmpmeta`) return false;

		return true;
	}

	/** @internal */
	public serialise(
		format: RdfSerialisationFormat = 'application/rdf+xml',
		options: RdfSerialisationOptions = {},
	): string {
		const namespaces: Record<string, string> = {};
		for (const prefix in this.schemas) {
			const schema = this.schemas[prefix]!;
			namespaces[prefix] = schema.namespaceURI;
		}

		const output = rdflib.serialize(
			null,
			this.kb,
			this.baseIRI,
			format,
			undefined,
			{ ...options, namespaces },
		);
		if (!output) {
			throw new Error(`Invalid output format '${format}'!`);
		}

		// Workaround for https://github.com/linkeddata/rdflib.js/issues/869.
		if (format === 'application/rdf+xml') {
			return output.replace(
				/<([^>\s]+)\s+rdf:parseType="Resource">(\s*<(?:rdf:Alt|rdf:Bag|rdf:Seq)[\s>])/g,
				'<$1>$2',
			);
		}

		return output;
	}

	/** @internal */
	public serialiseXmp(): string {
		const output = this.serialise('application/rdf+xml', undefined)
			.replace(/^( {4})+/gm, (match) => '\t'.repeat(match.length / 4))
			.replace(/\n$/, '')
			.replace(/^/gm, '\t');
		return `<?xpacket begin="${bom}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
${output}</x:xmpmeta>
<?xpacket end="w"?>`;
	}

	private getOrCreateRdfElement(xmpMeta: Element): Element {
		for (const childNode of xmpMeta.childNodes) {
			if (childNode.nodeType === Node.ELEMENT_NODE) {
				const child = childNode as unknown as Element;
				if (child.attributes) {
					for (let i = 0; i < child.attributes.length; ++i) {
						const attr = child.attributes.item(i);
						if (attr?.name.startsWith('xmlns:') && attr.name.length > 6) {
							if (attr.value === NS_RDF) {
								const prefix = attr.name.slice(6);
								if (child.nodeName === `${prefix}:RDF`) {
									return child;
								}
							}
						}
					}
				}
			}
		}

		// Create and attach <rdf:RDF>
		const newRdf = this.doc.createElementNS(NS_RDF, 'rdf:RDF');
		xmpMeta.appendChild(newRdf);
		return newRdf;
	}

	/**
	 * Registers a prefix for a given namespace. A number of namespaces have a
	 * default prefix that does not have to be set explicitely:
	 *
	 * * `Iptc4xmpCore`
	 * * `crs`
	 * * `dc`
	 * * `exif`
	 * * `pdf`
	 * * `photoshop`
	 * * `tiff`
	 * * `xmp`
	 * * `xmpBJ`
	 * * `xmpDM`
	 * * `xmpMM`
	 * * `xmpRights`
	 * * `xmpTPg`
	 *
	 * @param prefix - the prefix to register (must be non-empty)
	 * @param schema
	 */
	public registerNamespace(prefix: string, schema: XmpSchema) {
		if (!prefix?.length) {
			throw new Error('Missing or empty prefix argument!');
		}

		if (!schema) {
			throw new Error('No schema specified!');
		}

		if (!schema.namespaceURI) {
			throw new Error('No namespace URI specified!');
		}

		if (this.schemas[prefix]) {
			throw new Error(
				`Prefix '${prefix}' is already registered for URL '${this.schemas[prefix].namespaceURI}'!`,
			);
		}

		this.schemas[prefix] = schema;
		this.namespaces[prefix] = schema.namespaceURI;
		this.kb.setPrefixForURI('dc', schema.namespaceURI);
		this.registerPropertyNamespaces(schema.properties);
	}

	private registerPropertyNamespaces(properties: Record<string, RdfProperty>) {
		for (const name in properties) {
			const property = properties[name]!;

			if (property.valueType.termType !== 'Struct') {
				continue;
			}

			const valueType = property.valueType;
			const prefix = valueType.prefix;
			const namespaceURI = valueType.namespaceURI;

			if (typeof this.namespaces[prefix] !== 'undefined'
				&& this.namespaces[prefix] !== namespaceURI) {
				throw new Error(`Cannot register prefix '${prefix}'`
					+ ` for namespace URI '${namespaceURI}': already registered`
					+ ` for namespace URI '${this.namespaces[prefix]}'!`);
			}

			this.namespaces[prefix] = namespaceURI;

			this.registerPropertyNamespaces(valueType.properties);
		}
	}

	public getMetaInfo(path: string): string | string[] | null {
		const tokens = parsePath(path);
		if (!tokens.length) {
			throw new Error('Path must not be empty!');
		} else if (tokens.length > 1) {
			throw new Error('Nested meta information is not yet implemented!');
		}

		const token = tokens[0]!;

		return this.getMetaInfoLeaf(
			token.prefix,
			token.name,
			token.lang,
			token.index,
		);
	}

	private getMetaInfoLeaf(
		prefix: string,
		name: string,
		lang?: string,
		rdfIndex?: number,
	): string | string[] | null {
		const namespaceUri = this.schemas[prefix]?.namespaceURI;
		if (!namespaceUri) {
			throw new Error(`Unknown prefix: '${prefix}'`);
		}

		const subject = rdflib.sym(this.baseIRI);
		const predicate = rdflib.sym(namespaceUri + name);

		const node = this.kb.any(subject, predicate) as
			| rdflib.NamedNode
			| rdflib.BlankNode
			| null;
		if (!node) {
			return null;
		}

		// Direct scalar literal value.
		if ((node.termType as unknown) === 'Literal') {
			return node.value;
		}

		// RDF Container (Bag, Seq, Alt) or Struct node.
		if (node.termType === 'BlankNode' || node.termType === 'NamedNode') {
			const typeValue = this.kb.anyValue(node, RDF('type'));

			switch (typeValue) {
				case `${NS_RDF}Bag`:
				case `${NS_RDF}Seq`:
					return this.getItemsFromList(node, rdfIndex);

				case `${NS_RDF}Alt`:
					return this.getLanguageAlternative(node, lang);

				default:
					throw new Error(
						`Nested objects (type: ${typeValue}) not yet supported!`,
					);
			}
		}

		return null;
	}

	private getLanguageAlternative(
		container: rdflib.NamedNode | rdflib.BlankNode,
		lang: string | undefined,
	): string | null {
		const statements = this.getLanguageStatements(container);
		if (!statements.length) {
			return null;
		}

		const literals = statements.filter(
			(stmt): stmt is rdflib.Statement & { object: rdflib.Literal } =>
				stmt.object.termType === 'Literal',
		);

		const targetLang =
			lang && lang.trim() !== '' ? lang.toLowerCase() : 'x-default';

		const matchLang = (stmtLang: string, target: string) => {
			const normalized = stmtLang.toLowerCase();
			if (target === 'x-default') {
				return normalized === 'x-default' || normalized === '';
			}

			return normalized === target;
		};

		const exact = literals.find((s) =>
			matchLang(s.object.language, targetLang),
		);
		if (exact) {
			return exact.object.value;
		}

		// Subtag fallback (e.g., 'de-DE' -> 'de').
		if (targetLang.includes('-')) {
			const primaryLang = targetLang.split('-')[0]!;
			const primary = literals.find(
				(s) => s.object.language.toLowerCase() === primaryLang,
			);
			if (primary) {
				return primary.object.value;
			}
		}

		// Fallback to 'x-default' or untagged ('').
		if (targetLang !== 'x-default') {
			const defaultEntry = literals.find((s) =>
				matchLang(s.object.language, 'x-default'),
			);
			if (defaultEntry) {
				return defaultEntry.object.value;
			}
		}

		return null;
	}

	/**
	 * Get all language alternatives for a field.
	 *
	 * The field identified by `path` must exist and be of type `Alt`.
	 *
	 * An untagged value (`xml:lang=""`) is interpreted as `x-default`, but
	 * only if `x-default` is not explicitely set. If neither an value
	 *
	 * All language tags are normalised to lowercase.
	 *
	 * @param path the path, for example `dc:title`
	 * @returns a dictionary of language alternative values or `null`
	 */
	public getLanguageAlternatives(path: string): Record<string, string> | null {
		const tokens = parsePath(path);
		if (!tokens.length) {
			throw new Error('Path must not be empty!');
		} else if (tokens.length > 1) {
			throw new Error('Nested meta information is not yet implemented!');
		}

		const token = tokens[0]!;

		const namespaceUri = this.schemas[token.prefix]?.namespaceURI;
		if (!namespaceUri) {
			throw new Error(`Unknown prefix: '${token.prefix}'`);
		}

		const subject = rdflib.sym(this.baseIRI);
		const predicate = rdflib.sym(namespaceUri + token.name);

		const node = this.kb.any(subject, predicate) as
			| rdflib.NamedNode
			| rdflib.BlankNode
			| null;
		if (!node) {
			return null;
		}

		if (node.termType !== 'BlankNode' && node.termType !== 'NamedNode') {
			return null;
		}

		const typeValue = this.kb.anyValue(node, RDF('type'));

		if (typeValue !== `${NS_RDF}Alt`) {
			return null;
		}

		const statements = this.getLanguageStatements(node);
		const values: Record<string, string> = {};
		let firstLang: string | undefined;
		for (let i = 0; i < statements.length; ++i) {
			const stmt = statements[i]!;
			if (stmt.object.termType === 'Literal') {
				values[stmt.object.language.toLowerCase()] = stmt.object.value;
				if (typeof firstLang === 'undefined') {
					firstLang = stmt.object.language.toLowerCase();
				}
			}
		}

		if (typeof firstLang === 'undefined') return null;

		if (typeof values['x-default'] === 'undefined') {
			if (typeof values[''] !== 'undefined') {
				values['x-default'] = values[''];
			} else {
				values['x-default'] = values[firstLang]!;
			}
		}

		return values;
	}

	private getItemsFromList(
		container: rdflib.NamedNode | rdflib.BlankNode,
		rdfIndex: number | undefined,
	) {
		if (rdfIndex) {
			const itemNode = this.kb.any(container, RDF(`_${rdfIndex}`));

			return itemNode?.value ?? null;
		}

		// Get all values.
		const RDF_LI_PREFIX = `${NS_RDF}_`;

		// Extract items, parse their numeric index, sort by index, and map to values
		return this.kb
			.statementsMatching(container, null, null)
			.map((stmt) => {
				if (!stmt.predicate.value.startsWith(RDF_LI_PREFIX)) {
					return null;
				}

				const indexStr = stmt.predicate.value.slice(RDF_LI_PREFIX.length);
				const index = parseInt(indexStr, 10);

				if (Number.isNaN(index)) {
					return null;
				}

				return { index, value: stmt.object.value };
			})
			.filter((item): item is { index: number; value: string } => item !== null)
			.sort((a, b) => a.index - b.index)
			.map((item) => item.value);
	}

	public setMetaInfo(
		path: string,
		value: string,
		options: XMPSetMetaInfoOptions = {},
	) {
		const tokens = parsePath(path);
		if (!tokens.length) {
			throw new Error('Path must not be empty!');
		} else if (tokens.length > 1) {
			throw new Error('Nested meta information is not yet implemented!');
		}

		const token = tokens[0]!;

		const schema = this.schemas[token.prefix];
		if (!schema) {
			throw new Error(`Unknown prefix: '${token.prefix}`);
		}

		const namespaceUri = this.schemas[token.prefix]?.namespaceURI;

		const subject = rdflib.sym(this.baseIRI);
		const predicate = rdflib.sym(namespaceUri + token.name);

		const property = schema.properties[token.name];
		if (!property) {
			throw new Error(`Unknown property: '${token.prefix}:${token.name}'`);
		}

		const termType = property.valueType.termType;

		if (termType === 'Alt' || termType === 'Bag' || termType === 'Seq') {
			const node = rdflib.sym(`${namespaceUri}${token.name}`);
			const container = this.getContainer(subject, node, token.name, termType);

			if (!token.index) {
				this.setListItem(container, value, options);
			} else {
				this.setIndexedListItem(container, token.index, value, options);
			}
		} else if (termType === 'Lang Alt') {
			const node = rdflib.sym(`${namespaceUri}${token.name}`);
			const container = this.getContainer(subject, node, token.name, 'Alt');

			this.setLanguageAlternative(container, value, token.lang, options);
		} else {
			this.setLiteralMetaInfo(subject, predicate, value, options);
		}
	}

	private setLiteralMetaInfo(
		subject: rdflib.NamedNode,
		predicate: rdflib.NamedNode,
		value: string,
		options: XMPSetMetaInfoOptions,
	) {
		// 1. Remove existing triple(s) for this predicate (overwrite).
		const existingQuads = this.kb.statementsMatching(subject, predicate, null);
		if (existingQuads.length && options.noOverwrite) {
			return;
		}

		this.kb.removeStatements(existingQuads);

		// 2. Add the new value
		this.kb.add(subject, predicate, rdflib.literal(value));
	}

	private getContainer(
		subject: rdflib.NamedNode,
		node: rdflib.NamedNode,
		name: string,
		listType: 'Bag' | 'Seq' | 'Alt',
	): rdflib.NamedNode | rdflib.BlankNode {
		const targetContainerType = RDF(listType);

		let container = this.kb.any(subject, node, null) as
			| rdflib.NamedNode
			| rdflib.BlankNode
			| null;

		if (container) {
			const currentType = this.kb.any(container, RDF('type'), null);

			// Verify or repair the container type if mismatched.
			if (!currentType?.equals(targetContainerType)) {
				if (currentType) {
					this.kb.removeMany(container, RDF('type'), null);
				}
				this.kb.add(container, RDF('type'), targetContainerType);
			}
			return container;
		}

		container = rdflib.blankNode(name);

		// Adding explicit RDF type using rdflib's RDF namespace.
		this.kb.add(container, RDF('type'), targetContainerType);
		this.kb.add(subject, node, container);

		return container;
	}

	private getListItemIndices(
		container: rdflib.NamedNode | rdflib.BlankNode,
	): number[] {
		const RDF_LI_REGEX =
			/^http:\/\/www\.w3\.org\/1999\/02\/22-rdf-syntax-ns#_(\d+)$/;

		return this.kb.statementsMatching(container, null, null).flatMap((stmt) => {
			const match = stmt.predicate.value.match(RDF_LI_REGEX);
			return match ? [parseInt(match[1]!, 10)] : [];
		});
	}

	private setListItem(
		container: rdflib.NamedNode | rdflib.BlankNode,
		value: string,
		options: XMPSetMetaInfoOptions,
	) {
		let existing = this.getListItemIndices(container);
		if (options.noOverwrite && existing.length) {
			return;
		}

		if (!options.append) {
			this.clearContainerItems(container);
		} else {
			existing = [];
		}

		const highest = existing.length ? Math.max(...existing) : -1;

		const rdfIndex = highest + 2;
		this.kb.add(container, RDF(`_${rdfIndex}`), rdflib.literal(value));
	}

	private setIndexedListItem(
		container: rdflib.NamedNode | rdflib.BlankNode,
		rdfIndex: number,
		value: string,
		options: XMPSetMetaInfoOptions,
	) {
		const existing = this.getListItemIndices(container);
		const highest = existing.length ? Math.max(...existing) : 0;
		if (rdfIndex - highest > 1) {
			throw new RangeError(`Index '${rdfIndex}' out of range!`);
		}

		const predicate = RDF(`_${rdfIndex}`);

		if (rdfIndex <= highest) {
			if (options.noOverwrite) {
				return;
			}

			const statement = this.kb.anyStatementMatching(
				container,
				predicate,
				null,
			);
			if (statement) {
				this.kb.remove(statement);
			}
		}

		this.kb.add(container, predicate, rdflib.literal(value));
	}

	private setLanguageAlternative(
		container: rdflib.NamedNode | rdflib.BlankNode,
		value: string,
		lang: string | undefined,
		options: XMPSetMetaInfoOptions,
	) {
		if (!lang?.length) {
			lang = 'x-default';
		}

		const statements = this.getLanguageStatements(container);
		let rdfIndex = statements.length + 1;

		if (lang === 'x-default') {
			if (options.noOverwrite && statements.length) {
				// Check whether there is a default entry.
				for (let i = 0; i < statements.length; ++i) {
					const statement = statements[i];

					if (
						statement &&
						(statement.object.lang === '' ||
							statement.object.lang === 'x-default' ||
							!statement.object.lang)
					) {
						return;
					}
				}
			}

			// Wipe out all existing values.
			this.clearContainerItems(container);
			rdfIndex = 1;
		} else {
			for (let i = 0; i < statements.length; ++i) {
				const statement = statements[i];

				if (statement && statement.object.lang === lang) {
					if (options.noOverwrite) {
						return;
					}

					// Do not exit the loop here. If there are duplicates,
					// we want to delete them all, not just the first.
					this.kb.removeStatement(statement);
					rdfIndex = i + 1;
				}
			}
		}

		this.kb.add(
			container,
			rdflib.sym(`${NS_RDF}_${rdfIndex}`),
			rdflib.literal(value, lang),
		);
	}

	private clearContainerItems(
		container: rdflib.NamedNode | rdflib.BlankNode,
	): void {
		const RDF_LI_PREFIX = `${NS_RDF}_`;
		const RDF_LI = `${NS_RDF}li`;

		// Find all triples where container is the subject and predicate is an item index
		const itemStatements = this.kb
			.statementsMatching(container, null, null)
			.filter(
				(stmt) =>
					stmt.predicate.value.startsWith(RDF_LI_PREFIX) ||
					stmt.predicate.value === RDF_LI,
			);

		// Remove all matched item triples from the store
		this.kb.remove(itemStatements);
	}

	private getLanguageStatements(
		container: rdflib.NamedNode | rdflib.BlankNode,
	) {
		const allStatements = this.kb.statementsMatching(container, null, null);

		const ORDINAL_REGEX =
			/^http:\/\/www\.w3\.org\/1999\/02\/22-rdf-syntax-ns#_(\d+)$/;

		const statements: rdflib.Statement<
			SubjectType,
			PredicateType,
			rdflib.Literal
		>[] = [];
		for (const stmt of allStatements) {
			const match = stmt.predicate.value.match(ORDINAL_REGEX);

			// Ensure predicate is an ordinal (_1, _2, etc.) and object is a
			// Literal with a lang attribute.
			if (match && stmt.object.termType === 'Literal') {
				const index = parseInt(match[1]!, 10);
				if (index) {
					statements[index - 1] = stmt as rdflib.Statement<
						SubjectType,
						PredicateType,
						rdflib.Literal
					>;
				}
			}
		}

		return statements;
	}

	public getStructure(prefix: string, name: string): rdflib.BlankNode {
		const subject = rdflib.sym(this.baseIRI);
		const schema = this.schemas[prefix];
		if (!schema) {
			throw new Error(`No schema registered for prefix '${prefix}'.`);
		}

		const predicate = rdflib.sym(`${schema.namespaceURI}${name}`);
		const existing = this.kb.any(subject, predicate, null);

		// 1. Reuse existing blank/named node and strip any container rdf:type (Alt/Bag/Seq)
		if (
			existing &&
			(existing.termType === 'BlankNode' || existing.termType === 'NamedNode')
		) {
			this.kb.removeMany(existing as rdflib.NamedNode, RDF('type'), null);
			return existing as rdflib.BlankNode;
		}

		// 2. Clear out any previous value if it was a literal
		if (existing) {
			this.kb.removeMany(subject, predicate, null);
		}

		// 3. Create new blank node and attach it to the root subject
		const structNode = rdflib.blankNode();
		this.kb.add(subject, predicate, structNode);

		return structNode;
	}
}
