import { rdfBag } from '../../rdf/rdf-schema.js';
import { pdfaSchema } from '../value-types/pdfa/pdfa-schema.js';
import type { XmpSchema } from '../xmp-schema.js';

/**
 * PDF/A Extension namespace.
 *
 * This schema is required for defining XMP extension schemas. It is a
 * container with one or more extension schemas. The description of this schema
 * is missing in ISO 19005-1, and was added in ISO 19005-1: Document management
 * — Electronic document file format for long-term preservation — Part 1: Use
 * of PDF 1.4 (PDF/A-1) Technical Corrigendum 1, published 2007-04-01.
 *
 * * Schema namespace URI: `http://www.aiim.org/pdfa/ns/extension/`.
 * * Required schema namespace prefix: `pdfaExtension`.
 */
export const pdfaExtensionSchema: XmpSchema = {
	name: 'Extension',
	namespaceURI: 'http://www.aiim.org/pdfa/ns/extension/',
	prefix: 'pdfaExtension',
	properties: {
		schemas: {
			valueType: rdfBag(pdfaSchema),
		},
	},
};
