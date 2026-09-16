import {
	type RdfLiteral,
	type RdfStruct,
	rdfSeq,
} from '../../../rdf/rdf-schema.js';
import { xmpText } from '../core/basic/text.js';
import { xmpURI } from '../core/derived/uri.js';
import { pdfaProperty } from './pdfa-property.js';
import { pdfaValueType } from './pdfa-value-type.js';

/**
 * PDF/A Field namespace.
 *
 * This schema describes a single extension schema which may comprise an
 * arbitrary number of properties.
 *
 * Schema namespace URI: `http://www.aiim.org/pdfa/ns/schema#`.
 * Required schema namespace prefix: `pdfaSchema`.
 */
export const pdfaSchema: RdfStruct = {
	name: 'Schema',
	termType: 'Struct',
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
			valueType: xmpText,
		},

		/**
		 * Type: {@link rdfSeq} of {@link pdfaPropertySchema}
		 *
		 * Preferred schema namespace prefix.
		 *
		 * This prefix can be used in addition to the predefined XMP namespace
		 * prefixes.
		 */
		property: {
			valueType: rdfSeq(pdfaProperty),
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
		 * Type: {@link rdfSeq} of {@link pdfaValueType}
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
			valueType: rdfSeq(pdfaValueType),
		},
	},
};
