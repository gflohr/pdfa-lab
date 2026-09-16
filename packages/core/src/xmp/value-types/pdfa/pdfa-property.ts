import type { RdfStruct } from '../../../rdf/rdf-schema.js';
import { xmpText } from '../core/basic/text.js';
import { xmpClosedChoice } from '../core/derived/closed-choice.js';

/**
 * PDF/A Property namespace.
 *
 * This schema describes a single property.
 *
 * * Schema namespace URI: `http://www.aiim.org/pdfa/ns/property#`.
 * * Required schema namespace prefix: `pdfaProperty`.
 */
export const pdfaProperty: RdfStruct = {
	name: 'Property',
	termType: 'Struct',
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
