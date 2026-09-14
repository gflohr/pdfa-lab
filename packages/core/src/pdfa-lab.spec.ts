import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { PDFDocument, PDFRef } from '@cantoo/pdf-lib';
import { fontkit } from '@pdfa-lab/fontkit';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SingleByteEncodingMapper } from './encoding/mappers/single-byte-encoding-mapper.js';
import * as collectFont from './font/collect-fonts.js';
import type { FontInfo, FontMap } from './font/types.js';
import { type PDFAConversionOptions, PDFALab } from './pdfa-lab.js';

async function makePDFALab(): Promise<PDFALab> {
	const doc = await PDFDocument.create();
	const lab = new (
		PDFALab as unknown as {
			new (pdfDoc: PDFDocument): PDFALab;
		}
	)(doc);

	return lab;
}

const rootDir = path.resolve(import.meta.dirname, '..', '..', '..');
const pdfDir = path.resolve(rootDir, 'assets', 'pdfs');
const fontDir = path.resolve(rootDir, 'assets', 'fonts');
const notoDir = path.resolve(fontDir, 'noto');

describe('PDFALab', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('from', () => {
		it('wraps a real PDFDocument in a new PDFALab instance', async () => {
			const doc = await PDFDocument.create();

			const result = await PDFALab.from(doc);

			expect(result).toBeInstanceOf(PDFALab);
		});

		it('loads a PDFDocument from Uint8Array', async () => {
			const doc = await PDFDocument.create();
			const bytes = await doc.save();

			const result = await PDFALab.from(bytes);

			expect(result).toBeInstanceOf(PDFALab);
		});

		it('loads a PDFDocument from base64 string', async () => {
			const doc = await PDFDocument.create();
			const bytes = await doc.save();
			const base64 = Buffer.from(bytes).toString('base64');

			const result = await PDFALab.from(base64);

			expect(result).toBeInstanceOf(PDFALab);
		});

		it('recreates a "foreign" PDFDocument (same shape, different prototype)', async () => {
			const doc = await PDFDocument.create();
			const saveSpy = vi.fn(() => doc.save());
			const foreignDoc = { context: doc.context, save: saveSpy };

			const result = await PDFALab.from(foreignDoc as unknown as PDFDocument);

			expect(result).toBeInstanceOf(PDFALab);
			expect(saveSpy).toHaveBeenCalledTimes(1);
		});

		it('throws for invalid input', async () => {
			await expect(PDFALab.from(123 as unknown as string)).rejects.toThrow(
				/input must be/,
			);
		});

		it('falls back to PDFDocument.load for non-PDFDocument objects', async () => {
			const spy = vi.spyOn(PDFDocument, 'load');

			const bytes = new Uint8Array([37, 80, 68, 70]); // "%PDF" minimal header

			try {
				await PDFALab.from(bytes);
			} catch {
				// ignore parse error, we only care that load was called
			}

			expect(spy).toHaveBeenCalled();
		});
	});

	describe('embed fonts', () => {
		const fontInfos: FontInfo[] = [
			{
				ref: PDFRef.of(7),
				baseFont: 'Helvetica',
				fontName: 'Helvetica',
				embedded: false,
				subtype: 'Type0',
				encodingMapper: new SingleByteEncodingMapper('WinAnsiEncoding'),
			},
			{
				ref: PDFRef.of(8),
				baseFont: 'Helvetica-Oblique',
				fontName: 'Helvetica-Oblique',
				embedded: false,
				subtype: 'Type0',
				encodingMapper: new SingleByteEncodingMapper('WinAnsiEncoding'),
			},
			{
				ref: PDFRef.of(9),
				baseFont: 'Roboto',
				fontName: 'Roboto',
				embedded: true,
				subtype: 'TrueType',
				encodingMapper: new SingleByteEncodingMapper('WinAnsiEncoding'),
			},
		];
		const fontInfoMap = new Map<string, FontInfo>();
		fontInfos.forEach((f) => {
			fontInfoMap.set(f.ref.toString(), f);
		});

		it.skip('should embed all fonts', async () => {
			const lab = await makePDFALab();
			const collectMock = vi
				.spyOn(collectFont, 'default')
				.mockReturnValue(fontInfoMap);

			await lab.embedFonts(fontkit);

			expect(collectMock).toHaveBeenCalledTimes(1);
		});
	});

	describe('collect fonts', () => {
		it('should call the collectFont() implementation', async () => {
			const lab = await makePDFALab();
			const collectMock = vi
				.spyOn(collectFont, 'default')
				.mockReturnValue(new Map<string, FontInfo>());

			lab.collectFonts();

			expect(collectMock).toHaveBeenCalledTimes(1);
		});

		it('should cache the results', async () => {
			const lab = await makePDFALab();
			const fonts = new Map<string, FontInfo>();

			fonts.set('42 0 R', {
				ref: PDFRef.of(42),
				baseFont: 'Helvetica-1234',
				fontName: 'Helvetica',
				embedded: false,
				subtype: 'Type1',
				encodingMapper: new SingleByteEncodingMapper('MacRomanEncoding'),
			});
			fonts.set('43 0 R', {
				ref: PDFRef.of(43),
				baseFont: 'Times-Roman-5678',
				fontName: 'Times-Roman',
				embedded: false,
				subtype: 'Type1',
				encodingMapper: new SingleByteEncodingMapper('WinAnsiEncoding'),
			});
			const collectMock = vi
				.spyOn(collectFont, 'default')
				.mockReturnValue(fonts);

			const result1 = lab.collectFonts();
			expect(collectMock).toHaveBeenCalledTimes(1);
			expect(result1).toBe(fonts);
			const result2 = lab.collectFonts();
			expect(collectMock).toHaveBeenCalledTimes(1);
			expect(result2).toBe(fonts);
			const result3 = lab.collectFonts();
			expect(collectMock).toHaveBeenCalledTimes(1);
			expect(result3).toBe(fonts);
		});
	});

	describe('convert to PDF/A', () => {
		const pdfFilename = path.resolve(pdfDir, 'all-features-pdfa.pdf');
		let lab: PDFALab;
		const fontMap: FontMap = {
			Helvetica: {
				source: path.resolve(notoDir, 'NotoSans-Regular.ttf'),
			},
		};

		beforeAll(async () => {
			const pdfBytes = await fs.readFile(pdfFilename);
			lab = await PDFALab.from(pdfBytes);
		});

		it('should fill in default options', async () => {
			const lab = await makePDFALab();

			const options = {};
			const defaultOptions: PDFAConversionOptions = {
				embedFonts: true,
				fontEmbedOptions: {
					compress: true,
					fcMatch: 'fc-match',
					fontMap: {},
				},
			};

			await lab.makePDFA(options);

			expect(options).toStrictEqual(defaultOptions);
		});

		it('should embed all missing fonts', async () => {
			const embedFontSpy = vi.spyOn(PDFALab.prototype, 'embedFonts');

			await lab.makePDFA({
				fontkit,
				fontEmbedOptions: { fontMap },
			});

			expect(embedFontSpy).toHaveBeenCalledTimes(1);
			expect(embedFontSpy).toHaveBeenCalledWith(fontkit, {
				compress: true,
				fcMatch: 'fc-match',
				fontMap,
			});
		});
	});

	describe('XMP Metadata', () => {
		describe('Extract XMP Metadata', () => {
			it('should extract existing metadata', async () => {
				// This should
				const pdfFilename = path.resolve(pdfDir, 'factur-x.pdf');
				const pdfBytes = await fs.readFile(pdfFilename);
				const lab = await PDFALab.from(pdfBytes);
				const rdf = lab.extractXmp();

				expect(rdf).toMatchSnapshot();
			});
		});

		describe('Set XMP Metadata Packet', () => {
			it('should set new metadata', async () => {
				const pdfFilename = path.resolve(pdfDir, 'standard-fonts.pdf');
				const pdfBytes = await fs.readFile(pdfFilename);
				const rdf = `
	<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
		<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" rdf:about="">
			<dc:format>application/pdf</dc:format>
		</rdf:Description>
		<rdf:Description xmlns:pdf="http://ns.adobe.com/pdf/1.3/" rdf:about="">
			<pdf:Producer>@pdfa-lab/core unit tests</pdf:Producer>
			<pdf:PDFVersion>1.7</pdf:PDFVersion>
		</rdf:Description>
	</rdf:RDF>`;
				const lab = await PDFALab.from(pdfBytes);
				lab.setXmpMetadataPacket(rdf);

				const newPdfBytes = await lab.save();
				const newLab = await PDFALab.from(newPdfBytes);
				const xmp = newLab.extractXmp();
				expect(xmp).toMatchSnapshot();
			});

			it('should overwrite existing metadata', async () => {
				// This should
				const pdfFilename = path.resolve(pdfDir, 'factur-x.pdf');
				const pdfBytes = await fs.readFile(pdfFilename);
				const rdf = `
	<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
		<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" rdf:about="">
			<dc:format>application/pdf</dc:format>
		</rdf:Description>
		<rdf:Description xmlns:pdf="http://ns.adobe.com/pdf/1.3/" rdf:about="">
			<pdf:Producer>@pdfa-lab/core unit tests</pdf:Producer>
			<pdf:PDFVersion>1.7</pdf:PDFVersion>
		</rdf:Description>
	</rdf:RDF>`;
				const lab = await PDFALab.from(pdfBytes);
				lab.setXmpMetadataPacket(rdf);

				const newPdfBytes = await lab.save();
				const newLab = await PDFALab.from(newPdfBytes);
				const xmp = newLab.extractXmp();
				expect(xmp).toMatchSnapshot();
			});
		});
	});
});
