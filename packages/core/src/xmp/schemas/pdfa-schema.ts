import * as v from 'valibot';
import { xmpText } from '../value-types/core/basic/text.js';
import { XmpLiteral, type XmpSchema, xmpLiteral, xmpSeq } from '../xmp-schema.js';
import { xmpURI } from '../value-types/core/derived/uri.js';
import { pdfaPropertySchema } from './pdfa-property.js';

/**
 * PDF/A Field namespace.
 *
 * This schema describes a single extension schema which may comprise an
 * arbitrary number of properties.
 *
 * Schema namespace URI: `http://www.aiim.org/pdfa/ns/schema#`.
 * Required schema namespace prefix: `pdfaSchema`.
 */
export const pdfaSchema: XmpSchema = {
	name: 'Schema',
	namespaceURI: 'http://www.aiim.org/pdfa/ns/schema#',
	prefix: 'pdfaSchema',
	properties: {
		/**
		 * Type: {@link xmpURI}
		 *
		 * Schema namespace URI.
		 *
		 * Unique URI which describes the schema.
		 */
		namespaceURI: {
			valueType: xmpURI,
		},

		/**
		 * Type: {@link xmpText}
		 *
		 * Preferred schema namespace prefix.
		 *
		 * This prefix can be used in addition to the predefined XMP namespace
		 * prefixes.
		 */
		prefix: {
			valueType: xmpURI,
		},

		/**
		 * Type: {@link xmpSeq} of {@link pdfaPropertySchema}
		 *
		 * Preferred schema namespace prefix.
		 *
		 * This prefix can be used in addition to the predefined XMP namespace
		 * prefixes.
		 */
		property: {
			// FIXME! This must be a pdfaPropertySchema!
			//valueType: xmpSeq(pdfaPropertySchema),
			valueType: xmpSeq<XmpLiteral>(xmpText),
		},

		/**
		 * Type: {@link xmpText}
		 *
		 * Optional description of schema.
		 *
		 * Human-readable text.
		 */
		description: {
			description: 'Optional description of schema',
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpSeq} of {@link pdfaValueType}
		 *
		 * This property is required! The validation is strict!
		 *
		 * The field name.
		 *
		 * Field names must be valid XML element names
		 */
		valueType: {
			// FIXME! Must be a pdfaValueType. Solution: Everything but
			// pdfaExtension must be a value type, not a schema!
			valueType: xmpSeq<XmpLiteral>(xmpText),
		},
	},
};
