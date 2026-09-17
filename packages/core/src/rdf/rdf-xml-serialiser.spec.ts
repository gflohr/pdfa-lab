import { DOMParser } from '@xmldom/xmldom';
import * as rdflib from 'rdflib';
import { beforeEach, describe, expect, it } from 'vitest';
import { RdfXmlSerialiser } from './rdf-xml-serialiser.js';
import { RDF } from '../xmp/xmp-document.js';

describe('RdfXmlSerialiser', () => {
	const BASE_IRI = 'urn:xmp:doc';
	const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
	const DC_NS = 'http://purl.org/dc/elements/1.1/';
	const PDFA_EXT_NS = 'http://www.aiim.org/pdfa/ns/extension/';
	const PDFA_SCHEMA_NS = 'http://www.aiim.org/pdfa/ns/schema#';

	const prefixMap: Record<string, string> = {
		[DC_NS]: 'dc',
		[PDFA_EXT_NS]: 'pdfaExtension',
		[PDFA_SCHEMA_NS]: 'pdfaSchema',
	};

	let serialiser: RdfXmlSerialiser;
	let store: rdflib.Store;
	let docSubject: rdflib.NamedNode;

	beforeEach(() => {
		serialiser = new RdfXmlSerialiser(BASE_IRI);
		store = rdflib.graph();
		docSubject = rdflib.sym(BASE_IRI);
	});

	it('serialises simple literal properties and hoists namespaces to root', async () => {
		store.add(
			docSubject,
			rdflib.sym(`${DC_NS}title`),
			rdflib.literal('Sample Document'),
		);
		store.add(
			docSubject,
			rdflib.sym(`${DC_NS}format`),
			rdflib.literal('application/pdf'),
		);

		const xml = serialiser.serialise(store, prefixMap);

		expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/');
		expect(xml).toContain('<rdf:Description rdf:about="">');
		expect(xml).toContain('<dc:title>Sample Document</dc:title>');
		expect(xml).toContain('<dc:format>application/pdf</dc:format>');
		expect(xml).not.toContain('rdf:parseType');

		await expect(xml).toMatchFileSnapshot(
			'./__snapshots__/simple-literals.xml',
		);
	});

	it('serialises nested struct properties with rdf:parseType="Resource"', async () => {
		const structNode = rdflib.blankNode();
		store.add(docSubject, rdflib.sym(`${DC_NS}publisher`), structNode);
		store.add(
			structNode,
			rdflib.sym(`${DC_NS}name`),
			rdflib.literal('Acme Publishing'),
		);

		const xml = serialiser.serialise(store, prefixMap);

		expect(xml).toContain('<dc:publisher rdf:parseType="Resource">');
		expect(xml).toContain('<dc:name>Acme Publishing</dc:name>');
		expect(xml).not.toContain('<rdf:Description>');

		await expect(xml).toMatchFileSnapshot(
			'./__snapshots__/struct-property.xml',
		);
	});

	it('serialises containers (Bag) and sorts indexed items numerical order', async () => {
		const bagNode = rdflib.blankNode();
		store.add(docSubject, rdflib.sym(`${DC_NS}subject`), bagNode);
		store.add(bagNode, rdflib.sym(`${RDF_NS}type`), rdflib.sym(`${RDF_NS}Bag`));

		// Add out of order to verify numerical sorting.
		store.add(
			bagNode,
			rdflib.sym(`${RDF_NS}_2`),
			rdflib.literal('Second Item'),
		);
		store.add(bagNode, rdflib.sym(`${RDF_NS}_1`), rdflib.literal('First Item'));

		const xml = serialiser.serialise(store, prefixMap);

		expect(xml).toContain('<dc:subject>');
		expect(xml).toContain('<rdf:Bag>');
		expect(xml).toContain('<rdf:li>First Item</rdf:li>');
		expect(xml).toContain('<rdf:li>Second Item</rdf:li>');
		expect(xml.indexOf('First Item')).toBeLessThan(xml.indexOf('Second Item'));

		await expect(xml).toMatchFileSnapshot('./__snapshots__/container-bag.xml');
	});

	it('flattens struct items in containers directly into <rdf:li rdf:parseType="Resource">', async () => {
		const bagNode = rdflib.blankNode();
		const schemaStructNode = rdflib.blankNode();

		store.add(docSubject, rdflib.sym(`${PDFA_EXT_NS}schemas`), bagNode);
		store.add(bagNode, rdflib.sym(`${RDF_NS}type`), rdflib.sym(`${RDF_NS}Bag`));
		store.add(bagNode, rdflib.sym(`${RDF_NS}_1`), schemaStructNode);
		store.add(
			schemaStructNode,
			rdflib.sym(`${PDFA_SCHEMA_NS}schema`),
			rdflib.literal('Factur-X PDFA Extension Schema'),
		);

		const xml = serialiser.serialise(store, prefixMap);

		expect(xml).toContain(
			'xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"',
		);
		expect(xml).toContain(
			'xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"',
		);
		expect(xml).toContain('<pdfaExtension:schemas>');
		expect(xml).toContain('<rdf:Bag>');
		expect(xml).toContain('<rdf:li rdf:parseType="Resource">');
		expect(xml).toContain(
			'<pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>',
		);

		await expect(xml).toMatchFileSnapshot(
			'./__snapshots__/container-struct-item.xml',
		);
	});

	it('falls back to URI delimiter splitting for unregistered prefix namespaces', async () => {
		const customProp = rdflib.sym('http://example.org/custom#myProp');
		store.add(docSubject, customProp, rdflib.literal('Custom Value'));

		const xml = serialiser.serialise(store, {});

		expect(xml).toContain('xmlns:ns="http://example.org/custom#"');
		expect(xml).toContain('<ns:myProp>Custom Value</ns:myProp>');

		await expect(xml).toMatchFileSnapshot(
			'./__snapshots__/unregistered-prefix.xml',
		);
	});

	it('serialises language alternatives', async () => {
		const bagNode = rdflib.blankNode();
		store.add(docSubject, rdflib.sym(`${DC_NS}subject`), bagNode);
		store.add(bagNode, rdflib.sym(`${RDF_NS}type`), rdflib.sym(`${RDF_NS}Alt`));

		store.add(
			bagNode,
			rdflib.sym(`${RDF_NS}_1`),
			rdflib.literal('Les misérables', 'x-default'),
		);
		store.add(
			bagNode,
			rdflib.sym(`${RDF_NS}_2`),
			rdflib.literal('Les misérables', 'fr-FR'),
		);
		store.add(
			bagNode,
			rdflib.sym(`${RDF_NS}_3`),
			rdflib.literal('Die Elenden', 'de-DE'),
		);

		const xml = serialiser.serialise(store, prefixMap);

		expect(xml).toContain('<dc:subject>');
		expect(xml).toContain('<rdf:Alt>');
		expect(xml).toContain(
			'<rdf:li xml:lang="x-default">Les misérables</rdf:li>',
		);
		expect(xml).toContain('<rdf:li xml:lang="fr-FR">Les misérables</rdf:li>');
		expect(xml).toContain('<rdf:li xml:lang="de-DE">Die Elenden</rdf:li>');

		await expect(xml).toMatchFileSnapshot(
			'./__snapshots__/container-lang-alt.xml',
		);
	});

	it('preserves non-container rdf:type assertions on structs', () => {
		const structNode = rdflib.blankNode();
		const NS_EXCS = 'http://example.org/ns#CustomSchema';
		const customType = rdflib.sym(NS_EXCS);

		store.add(docSubject, rdflib.sym(`${DC_NS}publisher`), structNode);
		// Explicit non-container rdf:type assertion.
		store.add(structNode, rdflib.sym(`${RDF_NS}type`), customType);
		store.add(structNode, rdflib.sym(`${DC_NS}name`), rdflib.literal('Acme'));

		const xml = serialiser.serialise(store, {
			...prefixMap,
			[NS_EXCS]: 'excs',
		});

		expect(xml).toContain(`rdf:resource="${NS_EXCS}"`);
	});

	it('preserves explicit rdf:datatype while omitting implicit string and language datatypes', async () => {
		const XSD_NS = 'http://www.w3.org/2001/XMLSchema#';
		const XMP_NS = 'http://ns.adobe.com/xap/1.0/';

		const xsdDateTime = rdflib.sym(`${XSD_NS}dateTime`);
		const xsdInteger = rdflib.sym(`${XSD_NS}integer`);

		store.add(
			docSubject,
			rdflib.sym(`${XMP_NS}CreateDate`),
			rdflib.literal('2026-09-16T20:30:00Z', xsdDateTime),
		);

		store.add(
			docSubject,
			rdflib.sym(`${XMP_NS}Rating`),
			rdflib.literal('5', xsdInteger),
		);

		// Plain literal (implicit xsd:string -> should NOT emit rdf:datatype).
		store.add(
			docSubject,
			rdflib.sym(`${XMP_NS}CreatorTool`),
			rdflib.literal('pdfa-lab core'),
		);

		// Language-tagged literal (implicit rdf:langString -> should emit
		// xml:lang, NOT rdf:datatype).
		store.add(
			docSubject,
			rdflib.sym(`${DC_NS}title`),
			rdflib.literal('English Title', 'en-US'),
		);

		const xml = serialiser.serialise(store, {
			...prefixMap,
			[XMP_NS]: 'xmp',
			[XSD_NS]: 'xsd',
		});

		// Explicit datatypes must be emitted as rdf:datatype attributes.
		expect(xml).toContain(
			'<xmp:CreateDate rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">2026-09-16T20:30:00Z</xmp:CreateDate>',
		);
		expect(xml).toContain(
			'<xmp:Rating rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">5</xmp:Rating>',
		);

		// Plain string must not carry rdf:datatype="...#string".
		expect(xml).toContain('<xmp:CreatorTool>pdfa-lab core</xmp:CreatorTool>');
		expect(xml).not.toContain('XMLSchema#string');

		// Language-tagged literal must carry xml:lang but not
		// rdf:datatype="...#langString".
		expect(xml).toContain(
			'<dc:title xml:lang="en-US">English Title</dc:title>',
		);
		expect(xml).not.toContain('langString');

		await expect(xml).toMatchFileSnapshot('./__snapshots__/typed-literals.xml');
	});

	it('preserves non-membership properties on RDF container resources', async () => {
		const bagNode = rdflib.blankNode();
		const EX_NS = 'http://example.org/ns#';

		store.add(docSubject, rdflib.sym(`${DC_NS}subject`), bagNode);
		store.add(bagNode, rdflib.sym(`${RDF_NS}type`), rdflib.sym(`${RDF_NS}Bag`));

		// Membership items.
		store.add(bagNode, rdflib.sym(`${RDF_NS}_1`), rdflib.literal('Item 1'));

		// Non-membership property on the container itself.
		store.add(
			bagNode,
			rdflib.sym(`${EX_NS}containerMeta`),
			rdflib.literal('Container Metadata Value'),
		);

		const xml = serialiser.serialise(store, {
			...prefixMap,
			[EX_NS]: 'ex',
		});

		expect(xml).toContain('<dc:subject>');
		expect(xml).toContain('<rdf:Bag>');
		expect(xml).toContain('<rdf:li>Item 1</rdf:li>');
		expect(xml).toContain(
			'<ex:containerMeta>Container Metadata Value</ex:containerMeta>',
		);

		await expect(xml).toMatchFileSnapshot(
			'./__snapshots__/container-with-properties.xml',
		);
	});

	it('emits rdf:resource for NamedNode values', async () => {
		const EX_NS = 'http://example.org/ns#';
		const resourceUri = 'http://example.org/resources/doc1';

		store.add(
			docSubject,
			rdflib.sym(`${EX_NS}seeAlso`),
			rdflib.sym(resourceUri),
		);

		const xml = serialiser.serialise(store, { ...prefixMap, [EX_NS]: 'ex' });

		expect(xml).toContain(`<ex:seeAlso rdf:resource="${resourceUri}"/>`);

		await expect(xml).toMatchFileSnapshot(
			'./__snapshots__/named-node-resource.xml',
		);
	});

	it('preserves blank-node identity when a shared blank node is used as a container item', async () => {
		const EX_NS = 'http://example.org/ns#';

		const sharedNode = rdflib.blankNode();
		const bagNode = rdflib.blankNode();

		// 1. Setup doc -> ex:items -> Bag -> sharedNode
		store.add(docSubject, rdflib.sym(`${EX_NS}items`), bagNode);
		store.add(
			bagNode,
			rdflib.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
			rdflib.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#Bag'),
		);
		store.add(
			bagNode,
			rdflib.sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#_1'),
			sharedNode,
		);
		store.add(
			sharedNode,
			rdflib.sym(`${EX_NS}title`),
			rdflib.lit('Shared Container Item'),
		);

		// 2. Setup doc -> ex:primaryItem -> sharedNode (second reference)
		store.add(docSubject, rdflib.sym(`${EX_NS}primaryItem`), sharedNode);

		const xml = serialiser.serialise(store, { ...prefixMap, [EX_NS]: 'ex' });

		// Assert that the shared nodeID is present in the XML
		expect(xml).toContain(`rdf:nodeID="${sharedNode.value}"`);

		// Verify DOM structure directly (bypassing rdflib parser limitation with rdf:nodeID attributes)
		const dom = new DOMParser().parseFromString(xml, 'text/xml');

		const primaryEl = dom.getElementsByTagName('ex:primaryItem')[0]!;
		const liEl = dom.getElementsByTagName('rdf:li')[0]!;

		expect(primaryEl).toBeDefined();
		expect(liEl).toBeDefined();

		// Verify both elements reference the same nodeID across graph boundaries
		const primaryNodeId =
			primaryEl.getAttribute('rdf:nodeID') ||
			primaryEl
				.getElementsByTagName('rdf:Description')[0]
				?.getAttribute('rdf:nodeID');
		const liNodeId =
			liEl.getAttribute('rdf:nodeID') ||
			liEl
				.getElementsByTagName('rdf:Description')[0]
				?.getAttribute('rdf:nodeID');

		expect(primaryNodeId).toBe(sharedNode.value);
		expect(liNodeId).toBe(sharedNode.value);
	});

	// This test fails, and it looks like this is a bug in rdflib.js.
	// Investigate into it, and maybe file a bug report.
	it.skip('preserves shared container identity across RDF/XML round trips', () => {
		const store = rdflib.graph();
		const document = rdflib.sym('urn:xmp:doc');
		const container = rdflib.blankNode('shared-container');

		const rdfType = RDF('type');
		const rdfBag = RDF('Bag');
		const rdf1 = RDF('_1');

		const dcTitle = rdflib.sym('http://purl.org/dc/elements/1.1/title');
		const dcSubject = rdflib.sym('http://purl.org/dc/elements/1.1/subject');

		store.add(document, dcTitle, container);
		store.add(document, dcSubject, container);
		store.add(container, rdfType, rdfBag);
		store.add(container, rdf1, rdflib.literal('Brave New World', 'en-US'));

		const serialiser = new RdfXmlSerialiser('urn:xmp:doc');

		const xml = serialiser.serialise(store, {
			'http://purl.org/dc/elements/1.1/': 'dc',
		});

		const reparsed = rdflib.graph();
		rdflib.parse(xml, reparsed, 'urn:xmp:doc', 'application/rdf+xml');

		const reparsedTitle = reparsed.any(
			rdflib.sym('urn:xmp:doc'),
			dcTitle,
			null,
		) as rdflib.BlankNode;

		const reparsedSubject = reparsed.any(
			rdflib.sym('urn:xmp:doc'),
			dcSubject,
			null,
		);

		expect(reparsedTitle).not.toBeNull();
		expect(reparsedSubject).not.toBeNull();
		expect(reparsedTitle!.termType).toBe('BlankNode');
		expect(reparsedSubject!.termType).toBe('BlankNode');

		expect(reparsedTitle!.equals(reparsedSubject!)).toBe(true);

		// This assertion fails!
		expect(reparsed.any(reparsedTitle!, rdfType, rdfBag)).not.toBeNull();

		expect(reparsed.any(reparsedTitle!, rdf1, null)).not.toBeNull();
	});
});
