import { describe, expect, it } from 'vitest';
import { XmpDocument } from './xmp-document.js';

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
		it('should create a fresh XMP document', () => {
			const xmpDoc = new XmpDocument();

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toMatchSnapshot();
		});

		it('should accept an existing XMP document', () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toMatchSnapshot();
		});
	});

	describe('Serialisation Formats', () => {
		it('should serialise to application/rdf+xml', () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('application/rdf+xml');
			expect(xmp).toMatchSnapshot();
		});

		it('should serialise to text/turtle', () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('text/turtle');
			expect(xmp).toMatchSnapshot();
		});

		it('should serialise to applidation/n-triples', () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('application/n-triples');
			expect(xmp).toMatchSnapshot();
		});

		it('should serialise to applidation/ld+json', () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('application/ld+json');
			expect(xmp).toMatchSnapshot();
		});

		it('should serialise to text/n3', () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('text/n3');
			expect(xmp).toMatchSnapshot();
		});

		it('should serialise to application/nquads', () => {
			const xmpDoc = new XmpDocument(defaultPacket);

			const xmp = xmpDoc.serialise('application/nquads');
			expect(xmp).toMatchSnapshot();
		});
	});

	describe('setMetaInfo', () => {
		it('should add a new property to a fresh document', () => {
			const xmpDoc = new XmpDocument();
			xmpDoc.setMetaInfo('dc:format', 'text/plain');

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toContain('<dc:format>text/plain</dc:format>');
			expect(xmp).toMatchSnapshot();
		});

		it('should honour the `noOverwrite` option', () => {
			const xmpDoc = new XmpDocument(defaultPacket);
			xmpDoc.setMetaInfo('dc:format', 'text/plain', { noOverwrite: true });

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).not.toContain('<dc:format>text/plain</dc:format>');
			expect(xmp).toMatchSnapshot();
		});

		it('should set Seq items', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:creator', 'John Doe');

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain('<rdf:Seq><rdf:li>John Doe</rdf:li></rdf:Seq>');
			expect(xmp).toMatchSnapshot();
		});

		it('should overwrite Seq items by default', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:creator', 'John Doe');
			xmpDoc.setMetaInfo('dc:creator', 'Jane Doe');

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain('<rdf:Seq><rdf:li>Jane Doe</rdf:li></rdf:Seq>');
			expect(xmp).toMatchSnapshot();
		});

		it('should append Seq items if requested', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:creator', 'John Doe');
			xmpDoc.setMetaInfo('dc:creator', 'Jane Doe', { append: true });

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain(
				'<rdf:Seq><rdf:li>John Doe</rdf:li><rdf:li>Jane Doe</rdf:li></rdf:Seq>',
			);
			expect(xmp).toMatchSnapshot();
		});

		it('should set language alternatives', () => {
			const xmpDoc = new XmpDocument();

			const title = 'Internet For Dummies, Remedial Edition';
			xmpDoc.setMetaInfo('dc:title', title);

			const xmp = xmpDoc.serialiseXmp();
console.log(xmp);

			expect(xmp).toContain(`<rdf:li xml:lang="x-default">${title}</rdf:li>`);
			expect(xmp).toMatchSnapshot();
		});

		it.skip('should append localised language alternative values', () => {
			const xmpDoc = new XmpDocument();

			const title = 'Les Misérables';
			xmpDoc.setMetaInfo('dc:title', title);

			const titleDe = 'Die Elenden';
			xmpDoc.setMetaInfo('dc:title@de', titleDe);

			const xmp = xmpDoc.serialiseXmp();

			expect(xmp).toContain(`<rdf:li xml:lang="x-default">${title}</rdf:li>`);
			expect(xmp).toContain(`<rdf:li xml:lang="de">${titleDe}</rdf:li>`);
			expect(xmp).toMatchSnapshot();
		});

		it.skip('should wipe out all other language alternatives, when setting the default', () => {
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
			expect(xmp).toMatchSnapshot();
		});

		it.skip('should honour the noOverwrite option, when setting the default', () => {
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
			expect(xmp).toMatchSnapshot();
		});

		it.skip('should overwrite language alternative values by default', () => {
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
			expect(xmp).toMatchSnapshot();
		});

		it('should set individual indices', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:subject[1]', 'one');
			xmpDoc.setMetaInfo('dc:subject[2]', 'two');

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toContain('<rdf:li>one</rdf:li><rdf:li>two</rdf:li>');
			expect(xmp).toMatchSnapshot();
		});

		it('should overwrite existing indices', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:subject[1]', 'one');
			xmpDoc.setMetaInfo('dc:subject[2]', 'two');
			xmpDoc.setMetaInfo('dc:subject[1]', 'yksi');
			xmpDoc.setMetaInfo('dc:subject[2]', 'kaksi');

			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).not.toContain('<rdf:li>one</rdf:li><rdf:li>two</rdf:li>');
			expect(xmp).toContain('<rdf:li>yksi</rdf:li><rdf:li>kaksi</rdf:li>');
			expect(xmp).toMatchSnapshot();
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

		it.skip('should get values from language alternatives', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:title', 'Les Misérables');
			xmpDoc.setMetaInfo('dc:title@de', 'Die Elenden');

			expect(xmpDoc.getMetaInfo('dc:title')).toBe('Les Misérables');
			expect(xmpDoc.getMetaInfo('dc:title@x-default')).toBe('Les Misérables');
			expect(xmpDoc.getMetaInfo('dc:title@de')).toBe('Die Elenden');
		});
	});

	describe('get all language alternatives', () => {
		it.skip('should return all values', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:title@x-default', 'Les Misérables');
			xmpDoc.setMetaInfo('dc:title@de', 'Die Elenden');

			expect(xmpDoc.getLanguageAlternatives('dc:title')).toStrictEqual({
				'x-default': 'Les Misérables',
				de: 'Die Elenden',
			});
		});

		it.skip('should normalise all language tags', () => {
			const xmpDoc = new XmpDocument();

			xmpDoc.setMetaInfo('dc:title', 'Les Misérables');
			xmpDoc.setMetaInfo('dc:title@de-DE', 'Die Elenden');

			expect(xmpDoc.getLanguageAlternatives('dc:title')).toStrictEqual({
				'x-default': 'Les Misérables',
				'de-de': 'Die Elenden',
			});
		});

		it.skip('should fall back to the first language found', () => {
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
			console.log(xmpDoc.serialiseXmp());
		});
	});

	describe('Odd prefixes', () => {
		it('should accept and repair y as the xmpmeta prefix', () => {
			// Fixed by rdflib itself.
			const xmpPacket = `<?xpacket begin="${bom}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<y:xmpmeta xmlns:y="adobe:ns:meta/">
	<fdr:RDF xmlns:fdr="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
		<fdr:Description xmlns:dc="http://purl.org/dc/elements/1.1/" fdr:about="">
			<dc:format>application/pdf</dc:format>
		</fdr:Description>
	</fdr:RDF>
</y:xmpmeta>
<?xpacket end="w"?>
`;
			const xmpDoc = new XmpDocument(xmpPacket);
			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toMatchSnapshot();
		});

		it('should accept and repair fdr as the rdf prefix', () => {
			// Fixed by rdflib itself.
			const xmpPacket = `<?xpacket begin="${bom}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
	<fdr:RDF xmlns:fdr="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
		<fdr:Description xmlns:dc="http://purl.org/dc/elements/1.1/" fdr:about="">
			<dc:format>application/pdf</dc:format>
		</fdr:Description>
	</fdr:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
`;
			const xmpDoc = new XmpDocument(xmpPacket);
			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toMatchSnapshot();
		});

		it('should accept and repair cd as the Dublin Core prefix', () => {
			// Fixed by rdflib itself.
			const xmpPacket = `<?xpacket begin="${bom}" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
	<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
		<rdf:Description xmlns:cd="http://purl.org/dc/elements/1.1/" rdf:about="">
			<cd:format>application/pdf</cd:format>
		</rdf:Description>
	</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
`;
			const xmpDoc = new XmpDocument(xmpPacket);
			const xmp = xmpDoc.serialiseXmp();
			expect(xmp).toMatchSnapshot();
		});
	});

	describe('Nested schemas', () => {
		it.skip('should create nested data', () => {
			const xmpDoc = new XmpDocument();
		});
	});
});
