import type { RdfStruct } from '../../../../rdf/rdf-schema.js';
import { xmpDate } from '../basic/date.js';
import { xmpText } from '../basic/text.js';
import { xmpAgentName } from './agent-name.js';
import { xmpChoice } from './choice.js';
import { xmpGUID } from './guid.js';

/**
 * ResourceEvent
 *
 * A structure denoting a high-level event that occurred in the processing of a
 * resource.
 *
 * * The field namespace URI shall be `http://ns.adobe.com/xap/1.0/sType/ResourceEvent#`.
 * * The preferred field namespace prefix is `stEvt`.
 *
 * The structure shall include the `stEvt:action` and `stEvt:when` fields;
 * other fields need not be present. The fields, if used, shall be of the
 * specified types. The field content should be as described.
 */
export const xmpResourceEvent: RdfStruct = {
	name: 'ResourceEvent',
	description:
		'A structure denoting a high-level event that occurred in the processing of a resource.',
	termType: 'Struct',
	namespaceURI: 'http://ns.adobe.com/xap/1.0/sType/ResourceEvent#',
	prefix: 'stEvt',
	properties: {
		/**
		 * Type: Open choice of {@link xmpText}.
		 *
		 * The action that occurred. Defined values are: `converted`, `copied`,
		 * `created`, `cropped`, `edited`, `filtered`, `formatted`,
		 * `version_updated`, `printed`, `published`, `managed`, `produced`,
		 * `resized`, `saved`.
		 *
		 * New values should be verbs in the past tense.
		 */
		action: {
			valueType: xmpChoice,
			required: true,
		},

		/**
		 * Type: {@link xmpText}.
		 *
		 * A semicolon-delimited list of the parts of the resource that
		 * were changed since the previous event history.
		 *
		 * If not present, presumed to be undefined. When tracking changes and the
		 * scope of the changed components is unknown, it should be assumed that
		 * anything might have changed.
		 */
		changed: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpGUID}.
		 *
		 * The value of the `xmpMM:InstanceID` property for the modified (output)
		 * resource.
		 */
		instanceID: {
			valueType: xmpGUID,
		},

		/**
		 * Type: {@link xmpText}.
		 *
		 * Additional description of the action.
		 */
		parameters: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpAgentName}.
		 *
		 * The software agent that performed the action.
		 */
		softwareAgent: {
			valueType: xmpAgentName,
		},

		/**
		 * Type: {@link xmpDate}.
		 *
		 * Timestamp of when the action occurred.
		 *
		 * For events that create or write to a file, this should be the
		 * approximate modification time of the file.
		 */
		when: {
			valueType: xmpDate,
			required: true,
		},
	},
};
