import { describe, expect, it } from 'vitest';
import { rdfBag, rdfLiteral, rdfSeq } from '../rdf/rdf-schema.js';
import { XmpDocument } from './xmp-document.js';
import type { XmpSchema } from './xmp-schema.js';

const bom = '\uFEFF';
const defaultPacket = `<?xpacket begin="${bom}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
	<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
		<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" rdf:about="">
			<dc:format>application/pdf</dc:format>
		</rdf:Description>
		<rdf:Description xmlns:pdf="http://ns.adobe.com/pdf/1.3/" rdf:about="">
			<pdf:Producer>@pdfa-lab/core</pdf:Producer>
			<pdf:PDFVersion>1.7</pdf:PDFVersion>
		</rdf:Description>
	</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
`;

describe('XMP document', () => {
	describe('serialise XMP', () => {
		it('should create a fresh XMP document', async () => {
			const xmpDoc = new XmpDocument();

			const xmp = xmpDoc.serialiseXmp();
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/fresh.xml');
		});

		it('should accept an existing XMP document', async () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialiseXmp();

			await expect(xmp).toMatchFileSnapshot('./__snapshots__/default.xml');
		});
	});

	describe('Serialisation Formats', () => {
		it('should serialise to application/rdf+xml', async () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('application/rdf+xml');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/default-xmp.xml');
		});

		it('should serialise to text/turtle', async () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('text/turtle');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/default.turtle');
		});

		it('should serialise to applidation/n-triples', async () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('application/n-triples');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/default.n-tripes');
		});

		it('should serialise to applidation/ld+json', async () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('application/ld+json');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/default.json');
		});

		it('should serialise to text/n3', async () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('text/n3');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/default.n3');
		});

		it('should serialise to application/nquads', async () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('application/nquads');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/default.nquads');
		});
	});

	describe('setMetaInfo', () => {
		it('should add a new property to a fresh document', async () => {
			const xmpDoc = new XmpDocument();
			xmpDoc.setMetaInfo('dc:format', 'text/plain');

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toContain('<dc:format>text/plain</dc:format>');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/dc-format.xml');
		});

		it('should honour the `noOverwrite` option', async () => {
			const xmpDoc = new XmpDocument();
			xmpDoc.setMetaInfo('dc:format', 'text/plain', { noOverwrite: true });
			xmpDoc.setMetaInfo('dc:format', 'application/pdf', { noOverwrite: true });

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).not.toContain('<dc:format>application/pdf</dc:format>');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/dc-format.xml');
		});

		it('should set Seq items', async () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:creator', 'Jane Doe');

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain('<rdf:Seq>');
			expect(xmp).toContain('<rdf:li>Jane Doe</rdf:li>');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/simple-seq.xml');
		});

		it('should overwrite Seq items by default', async () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:creator', 'John Doe');
			xmpDoc.setMetaInfo('dc:creator', 'Jane Doe');

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain('<rdf:Seq>');
			expect(xmp).toContain('<rdf:li>Jane Doe</rdf:li>');
			expect(xmp).not.toContain('<rdf:li>John Doe</rdf:li>');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/simple-seq.xml');
		});

		it('should append Seq items if requested', async () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:creator', 'John Doe');
			xmpDoc.setMetaInfo('dc:creator', 'Jane Doe', { append: true });

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain('<rdf:Seq>');
			expect(xmp).toContain('<rdf:li>John Doe</rdf:li>');
			expect(xmp).toContain('<rdf:li>Jane Doe</rdf:li>');
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/2-item-seq.xml');
		});

		it('should set language alternatives', async () => {
			const xmpDoc = new XmpDocument();

			const title = 'Internet For Dummies, Remedial Edition';
			xmpDoc.setMetaInfo('dc:title', title);

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain(`<rdf:li xml:lang="x-default">${title}</rdf:li>`);
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/dc-title.xml');
		});

		it('should append localised language alternative values', async () => {
			const xmpDoc = new XmpDocument();

			const title = 'Les Misérables';
			xmpDoc.setMetaInfo('dc:title', title);

			const titleDe = 'Die Elenden';
			xmpDoc.setMetaInfo('dc:title@de', titleDe);

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain(`<rdf:li xml:lang="x-default">${title}</rdf:li>`);
			expect(xmp).toContain(`<rdf:li xml:lang="de">${titleDe}</rdf:li>`);
			await expect(xmp).toMatchFileSnapshot(
				'./__snapshots__/dc-title-localised.xml',
			);
		});

		it('should wipe out all other language alternatives, when setting the default', async () => {
			const xmpDoc = new XmpDocument();

			const oldTitleFr = 'Les Misérables';
			xmpDoc.setMetaInfo('dc:title', oldTitleFr);

			const oldTitleDe = 'Die Elenden';
			xmpDoc.setMetaInfo('dc:title@de-DE', oldTitleDe);

			const newTitle = '1000 Classic Pranks';
			xmpDoc.setMetaInfo('dc:title', newTitle);

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).not.toContain('de-DE');
			expect(xmp).toContain(
				`<rdf:li xml:lang="x-default">${newTitle}</rdf:li>`,
			);
			await expect(xmp).toMatchFileSnapshot(
				'./__snapshots__/dc-title-wiped-out.xml',
			);
		});

		it('should honour the noOverwrite option, when setting the default', async () => {
			const xmpDoc = new XmpDocument();

			const oldTitle = 'Les Misérables';
			xmpDoc.setMetaInfo('dc:title', oldTitle);

			const newTitle = '1000 Classic Pranks';
			xmpDoc.setMetaInfo('dc:title', newTitle, { noOverwrite: true });

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).not.toContain('de-DE');
			expect(xmp).toContain(
				`<rdf:li xml:lang="x-default">${oldTitle}</rdf:li>`,
			);
			await expect(xmp).toMatchFileSnapshot(
				'./__snapshots__/dc-title-new-default.xml',
			);
		});

		it('should overwrite language alternative values by default', async () => {
			const xmpDoc = new XmpDocument();

			const title = 'Les Misérables';
			xmpDoc.setMetaInfo('dc:title', title);

			const titleDe = 'Die Elenden';
			xmpDoc.setMetaInfo('dc:title@de', titleDe);
			const fallbackTitleDe = 'Die Pest';
			xmpDoc.setMetaInfo('dc:title@de', fallbackTitleDe);

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain(`<rdf:li xml:lang="x-default">${title}</rdf:li>`);
			expect(xmp).not.toContain(`<rdf:li xml:lang="de">${titleDe}</rdf:li>`);
			expect(xmp).toContain(
				`<rdf:li xml:lang="de">${fallbackTitleDe}</rdf:li>`,
			);
			await expect(xmp).toMatchFileSnapshot(
				'./__snapshots__/dc-title-overwritten.xml',
			);
		});

		it('should set individual indices', async () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:subject[1]', 'one');
			xmpDoc.setMetaInfo('dc:subject[2]', 'two');

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toContain('<rdf:li>one</rdf:li>');
			expect(xmp).toContain('<rdf:li>two</rdf:li>');
			await expect(xmp).toMatchFileSnapshot(
				'./__snapshots__/dc-subject-one-two.xml',
			);
		});

		it('should overwrite existing indices', async () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:subject[1]', 'one');
			xmpDoc.setMetaInfo('dc:subject[2]', 'two');
			xmpDoc.setMetaInfo('dc:subject[1]', 'yksi');
			xmpDoc.setMetaInfo('dc:subject[2]', 'kaksi');

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).not.toContain('<rdf:li>one</rdf:li>');
			expect(xmp).not.toContain('<rdf:li>two</rdf:li>');
			expect(xmp).toContain('<rdf:li>yksi</rdf:li>');
			expect(xmp).toContain('<rdf:li>kaksi</rdf:li>');
			await expect(xmp).toMatchFileSnapshot(
				'./__snapshots__/dc-subject-yksi-kaksi.xml',
			);
		});

		it('should not allow gaps', () => {
			const xmpDoc = new XmpDocument();

			expect(() => xmpDoc.setMetaInfo('dc:subject[2]', 'two')).toThrow(
				"Index '2' out of range!",
			);
			xmpDoc.setMetaInfo('dc:subject[1]', 'one');
			expect(() => xmpDoc.setMetaInfo('dc:subject[3]', 'three')).toThrow(
				"Index '3' out of range!",
			);
		});

		it('should append for empty indices', async () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:subject[]', 'one');
			xmpDoc.setMetaInfo('dc:subject[2]', 'two');
			xmpDoc.setMetaInfo('dc:subject[]', 'three');

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toContain('<rdf:li>one</rdf:li>');
			expect(xmp).toContain('<rdf:li>two</rdf:li>');
			expect(xmp).toContain('<rdf:li>three</rdf:li>');
			await expect(xmp).toMatchFileSnapshot(
				'./__snapshots__/dc-subject-one-two-three.xml',
			);
		});
	});

	describe('getMetaInfo', () => {
		it('should get an existing property', () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			expect(xmpDoc.getMetaInfo('dc:format')).toBe('application/pdf');
		});

		it('should return null for non-existing properties', () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			expect(xmpDoc.getMetaInfo('dc:identifier')).toBeNull();
		});

		it('should get a list of values from a bag', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:subject', 'Homer');
			xmpDoc.setMetaInfo('dc:subject', 'Marge', { append: true });

			expect(xmpDoc.getMetaInfo('dc:subject')).toStrictEqual([
				'Homer',
				'Marge',
			]);
		});

		it('should get a list of values from a sequence', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:creator', 'one');
			xmpDoc.setMetaInfo('dc:creator', 'two', { append: true });
			xmpDoc.setMetaInfo('dc:creator', 'three', { append: true });
			xmpDoc.setMetaInfo('dc:creator', 'four', { append: true });
			xmpDoc.setMetaInfo('dc:creator', 'five', { append: true });

			expect(xmpDoc.getMetaInfo('dc:creator')).toStrictEqual([
				'one',
				'two',
				'three',
				'four',
				'five',
			]);
		});

		it('should get values from language alternatives', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:title', 'Les Misérables');
			xmpDoc.setMetaInfo('dc:title@de', 'Die Elenden');

			expect(xmpDoc.getMetaInfo('dc:title')).toBe('Les Misérables');
			expect(xmpDoc.getMetaInfo('dc:title@x-default')).toBe('Les Misérables');
			expect(xmpDoc.getMetaInfo('dc:title@de')).toBe('Die Elenden');
		});
	});

	describe('get all language alternatives', () => {
		it('should return all values', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:title@x-default', 'Les Misérables');
			xmpDoc.setMetaInfo('dc:title@de', 'Die Elenden');

			expect(xmpDoc.getLanguageAlternatives('dc:title')).toStrictEqual({
				'x-default': 'Les Misérables',
				de: 'Die Elenden',
			});
		});

		it('should normalise all language tags', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:title', 'Les Misérables');
			xmpDoc.setMetaInfo('dc:title@de-DE', 'Die Elenden');

			expect(xmpDoc.getLanguageAlternatives('dc:title')).toStrictEqual({
				'x-default': 'Les Misérables',
				'de-de': 'Die Elenden',
			});
		});

		it('should fall back to the first language found', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:title@fr-FR', 'Overwrite me!');
			xmpDoc.setMetaInfo('dc:title@de-DE', 'Die Elenden');
			xmpDoc.setMetaInfo('dc:title@fi-FI', 'Kurjat');
			xmpDoc.setMetaInfo('dc:title@bg-BG', 'Клетниците');
			xmpDoc.setMetaInfo('dc:title@fr-FR', 'Les Misérables');

			expect(xmpDoc.getLanguageAlternatives('dc:title')).toStrictEqual({
				'x-default': 'Les Misérables',
				'de-de': 'Die Elenden',
				'fr-fr': 'Les Misérables',
				'fi-fi': 'Kurjat',
				'bg-bg': 'Клетниците',
			});
		});
	});

	describe('Odd prefixes', () => {
		it('should accept and repair y as the xmpmeta prefix', async () => {
			// Fixed by rdflib itself.
			const xmpPacket = `<?xpacket begin="${bom}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<y:xmpmeta xmlns:y="adobe:ns:meta/">
	<fdr:RDF xmlns:fdr="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
		<fdr:Description xmlns:dc="http://purl.org/dc/elements/1.1/" fdr:about="">
			<dc:format>text/plain</dc:format>
		</fdr:Description>
	</fdr:RDF>
</y:xmpmeta>
<?xpacket end="w"?>
`;
			const xmpDoc = new XmpDocument(xmpPacket);
			const xmp = xmpDoc.serialiseXmp();
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/dc-format.xml');
		});

		it('should accept and repair fdr as the rdf prefix', async () => {
			// Fixed by rdflib itself.
			const xmpPacket = `<?xpacket begin="${bom}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
	<fdr:RDF xmlns:fdr="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
		<fdr:Description xmlns:dc="http://purl.org/dc/elements/1.1/" fdr:about="">
			<dc:format>text/plain</dc:format>
		</fdr:Description>
	</fdr:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
`;
			const xmpDoc = new XmpDocument(xmpPacket);
			const xmp = xmpDoc.serialiseXmp();
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/dc-format.xml');
		});

		it('should accept and repair cd as the Dublin Core prefix', async () => {
			// Fixed by rdflib itself.
			const xmpPacket = `<?xpacket begin="${bom}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
	<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
		<rdf:Description xmlns:cd="http://purl.org/dc/elements/1.1/" rdf:about="">
			<cd:format>text/plain</cd:format>
		</rdf:Description>
	</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
`;
			const xmpDoc = new XmpDocument(xmpPacket);
			const xmp = xmpDoc.serialiseXmp();
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/dc-format.xml');
		});
	});

	describe('Nested lists', () => {
		const schema: XmpSchema = {
			name: 'Example',
			namespaceURI: 'http://example.org/example/',
			prefix: 'ex',
			properties: {
				bagOfSeq: {
					valueType: rdfBag(rdfSeq(rdfLiteral('inner'))),
				},
			},
		};

		it('should set the inner literal', async () => {
			const xmpDoc = new XmpDocument();
			xmpDoc.registerNamespace('ex', schema);

			xmpDoc.setMetaInfo('ex:bagOfSeq[1][1]', 'findme');

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toContain('<rdf:Bag>');
			expect(xmp).toContain('<rdf:Seq>');
			expect(xmp).toContain('<rdf:li>findme</rdf:li>');
			await expect(xmp).toMatchFileSnapshot(
				'./__snapshots__/bag-of-seq-1-1.xml',
			);
		});
	});

	describe('Nested schemas', () => {
		it('should create nested data', async () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo(
				'xmpMM:DerivedFrom/stRef:documentID',
				'abc-def-ghi-xyz',
			);

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain(
				'<stRef:documentID>abc-def-ghi-xyz</stRef:documentID>',
			);
			await expect(xmp).toMatchFileSnapshot('./__snapshots__/derived-from.xml');
		});

		it('should choke on literals as nodes', () => {
			const xmpDoc = new XmpDocument();

			expect(() =>
				xmpDoc.setMetaInfo('dc:format/xy:unknown', 'abc-def-ghi-xyz'),
			).toThrow("Intermediate node 'dc:format' is a literal!");
		});

		it.skip('should create lists', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo(
				'pdfaExtension:schemas[1]/pdfaSchema:schema',
				'Factur-X PDF/A Extension Schema',
			);

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain(
				'<pdfaSchema:schema>Factur-X PDF/A Extension Schema</pdfaSchema:schema>',
			);
		});
	});
});
