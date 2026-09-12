import * as v from 'valibot';
import { xmpText } from '../value-types/core/basic/text.js';
import { xmpClosedChoice } from '../value-types/core/derived/closed-choice.js';
import { type XmpSchema, xmpLiteral } from '../xmp-schema.js';

/**
 * PDF/A Property namespace.
 *
 * This schema describes a single property.
 *
 * * Schema namespace URI: `http://www.aiim.org/pdfa/ns/property#`.
 * * Required schema namespace prefix: `pdfaProperty`.
 */
export const pdfaPropertySchema: XmpSchema = {
	name: 'Field',
	namespaceURI: 'http://www.aiim.org/pdfa/ns/property#',
	prefix: 'pdfaProperty',
	properties: {
		/**
		 * Type: closed {@link xmpChoice} of {@link xmpText}
		 *
		 * Property category: `internal` or `external`.
		 */
		category: {
			description: 'Description of the property',
			valueType: xmpClosedChoice(['external', 'internal']),
		},

		/**
		 * Type: {@link xmpText}
		 *
		 * Description of the property .
		 *
		 * Human-readable text.
		 */
		description: {
			description: 'Description of the property',
			valueType: xmpText,
		},
	},
};
