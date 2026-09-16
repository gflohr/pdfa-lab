import type { RdfStruct } from '../../../rdf/rdf-schema.js';
import { xmpReal } from '../core/basic/real.js';
import { xmpChoice } from '../core/derived/choice.js';

/**
 * Dimensions
 *
 * A structure containing dimensions for a drawn object.
 *
 * The field namespace URI is http://ns.adobe.com/xap/1.0/sType/Dimensions#
 * The preferred field namespace prefix is stDim
 */
export const xmpDimensions: RdfStruct = {
	name: 'Dimensions',
	description: 'A structure containing dimensions for a drawn object.',
	termType: 'Struct',
	namespaceURI: 'http://ns.adobe.com/xap/1.0/sType/Dimensions#',
	prefix: 'stDim',
	properties: {
		/**
		 * Type: {@link xmpReal}.
		 *
		 * The width magnitude.
		 */
		w: {
			valueType: xmpReal,
		},

		/**
		 * Type: {@link xmpReal}.
		 *
		 * The height magnitude.
		 */
		h: {
			valueType: xmpReal,
		},

		/**
		 * Type: Open {@link xmpChoice}.
		 *
		 * Units. For example: inch, mm, pixel, pica, point
		 */
		units: {
			valueType: xmpChoice,
		},
	},
};
