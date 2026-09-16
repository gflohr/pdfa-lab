import type { RdfStruct } from '../../../../rdf/rdf-schema.js';
import { xmpDate } from '../basic/date.js';
import { xmpText } from '../basic/text.js';
import { xmpProperName } from './proper-name.js';
import { xmpResourceEvent } from './resource-event.js';

/**
 * Version
 *
 * Describes one version of a document.
 *
 * * The field namespace URI is `http://ns.adobe.com/xap/1.0/sType/Version#`.
 * * The preferred field namespace prefix is `stVer`.
 */
export const xmpVersion: RdfStruct = {
	name: 'Version',
	description: 'Describes one version of a document.',
	termType: 'Struct',
	namespaceURI: 'http://ns.adobe.com/xap/1.0/sType/Version#',
	prefix: 'stVer',
	properties: {
		/**
		 * Type: {@link xmpText}.
		 *
		 * Comments concerning what was changed.
		 */
		comments: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpResourceEvent}.
		 *
		 * High-level, formal description of what operation the user performed.
		 */
		event: {
			valueType: xmpResourceEvent,
		},

		/**
		 * Type: {@link xmpProperName}.
		 *
		 * The person who modified this version.
		 */
		modifier: {
			valueType: xmpProperName,
		},

		/**
		 * Type: {@link xmpDate}.
		 *
		 * The date on which this version was checked in.
		 */
		modifyDate: {
			valueType: xmpDate,
		},

		/**
		 * Type: {@link xmpText}.
		 *
		 * The new version number.
		 */
		version: {
			valueType: xmpText,
		},
	},
};
