import * as rdflib from 'rdflib';
import { beforeEach, describe, expect, it } from 'vitest';
import { RdfXmlSerialiser } from './rdf-xml-serialiser.js';

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

		// Add out of order to verify numerical sorting
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

		// 1. Explicit datatype (xsd:dateTime)
		store.add(
			docSubject,
			rdflib.sym(`${XMP_NS}CreateDate`),
			rdflib.literal('2026-09-16T20:30:00Z', xsdDateTime),
		);

		// 2. Explicit datatype (xsd:integer)
		store.add(
			docSubject,
			rdflib.sym(`${XMP_NS}Rating`),
			rdflib.literal('5', xsdInteger),
		);

		// 3. Plain literal (implicit xsd:string -> should NOT emit rdf:datatype)
		store.add(
			docSubject,
			rdflib.sym(`${XMP_NS}CreatorTool`),
			rdflib.literal('pdfa-lab core'),
		);

		// 4. Language-tagged literal (implicit rdf:langString -> should emit xml:lang, NOT rdf:datatype)
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

		// Explicit datatypes must be emitted as rdf:datatype attributes
		expect(xml).toContain(
			'<xmp:CreateDate rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">2026-09-16T20:30:00Z</xmp:CreateDate>',
		);
		expect(xml).toContain(
			'<xmp:Rating rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">5</xmp:Rating>',
		);

		// Plain string must not carry rdf:datatype="...#string"
		expect(xml).toContain('<xmp:CreatorTool>pdfa-lab core</xmp:CreatorTool>');
		expect(xml).not.toContain('XMLSchema#string');

		// Language-tagged literal must carry xml:lang but not rdf:datatype="...#langString"
		expect(xml).toContain(
			'<dc:title xml:lang="en-US">English Title</dc:title>',
		);
		expect(xml).not.toContain('langString');

		await expect(xml).toMatchFileSnapshot('./__snapshots__/typed-literals.xml');
	});
});
