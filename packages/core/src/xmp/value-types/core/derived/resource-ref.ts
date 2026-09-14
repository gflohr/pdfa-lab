import { type RdfStruct, rdfBag } from '../../../../rdf/rdf-schema.js';
import { xmpDate } from '../basic/date.js';
import { xmpText } from '../basic/text.js';
import { xmpAgentName } from './agent-name.js';
import { xmpClosedChoice } from './closed-choice.js';
import { xmpGUID } from './guid.js';
import { xmpPart } from './part.js';
import { xmpRenditionClass } from './rendition-class.js';
import { xmpURI } from './uri.js';

/**
 * ResourceRef
 *
 * A multiple part reference to a resource. Used to indicate prior versions,
 * originals of renditions, originals for derived documents, and so on. The
 * fields present in any specific reference depend on usage and on whether
 * the referenced resource is managed. Except for instanceID, the fields are
 * all properties from the referenced resource’s xmpMM namespace.
 *
 * * The field namespace URI is http://ns.adobe.com/xap/1.0/sType/ResourceRef#
 * * The preferred field namespace prefix is `stRef`
 */
export const xmpResourceRef: RdfStruct = {
	name: 'ResourceRef',
	description:
		'A structure denoting a multiple-component reference to a resource. The field values are taken from various properties in the referenced resource.',
	termType: 'Struct',
	namespaceURI: 'http://ns.adobe.com/xap/1.0/sType/ResourceRef#',
	prefix: 'stRef',
	properties: {
		/**
		 * Type: Ordered list of {@link xmpURI}.
		 *
		 * The referenced resource’s fallback file paths or URLs. The sequence
		 * order is the recommended order in attempting to locate the resource.
		 */
		alternatePaths: {
			valueType: rdfBag(xmpURI),
		},

		/**
		 * Type: {@link xmpGUID}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		documentID: {
			valueType: xmpGUID,
		},

		/**
		 * Type: {@link xmpURI}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		filePath: {
			valueType: xmpURI,
		},

		/**
		 * Type: {@link xmpPart}.
		 *
		 * For a resource within an `xmpMM:Ingredients` list, the part of this
		 * resource that is incorporated in the containing document
		 */
		fromPart: {
			valueType: xmpPart,
		},

		/**
		 * Type: {@link xmpGUID}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		instanceID: {
			valueType: xmpGUID,
		},

		/**
		 * Type: {@link xmpDate}.
		 *
		 * The value of `stEvt:when` for the last time the file was written.
		 */
		lastModifyDate: {
			valueType: xmpDate,
		},

		/**
		 * Type: {@link xmpAgentName}
		 *
		 * The referenced resource’s `xmpMM:Manager`.
		 */
		manager: {
			valueType: xmpAgentName,
		},

		/**
		 * Type: {@link xmpText}
		 *
		 * The referenced resource’s `xmpMM:ManagerVariant`.
		 */
		managerVariant: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpURI}
		 *
		 * The referenced resource’s `xmpMM:ManageTo`.
		 */
		manageTo: {
			valueType: xmpURI,
		},

		/**
		 * Type: {@link xmpURI}
		 *
		 * The referenced resource’s `xmpMM:ManageUI`.
		 */
		manageUI: {
			valueType: xmpURI,
		},

		/**
		 * Type: Closed {@link xmpChoice}
		 *
		 * For a resource within an xmpMM:Ingredients list, whether markers in this
		 * resource should be ignored (masked) or processed normally. One of:
		 *
		 * * All: Ignore markers in this ingredient and all its children.
		 * * None: Process markers in this ingredient and all its children.
		 */
		maskMarkers: {
			valueType: xmpClosedChoice(['All', 'None']),
		},

		/**
		 * Type: {@link xmpText}
		 *
		 * The name or URI of a mapping function used to map the fromPart to the
		 * toPart. The default for time mappings is "linear".
		 */
		partMapping: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpRenditionClass}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		renditionClass: {
			valueType: xmpRenditionClass,
		},

		/**
		 * Type: {@link xmpText}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		renditionParams: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpPart}.
		 *
		 * For a resource within an xmpMM:Ingredients list, the part of the
		 * containing document into which this resource is incorporated.
		 */
		toPart: {
			valueType: xmpPart,
		},

		/**
		 * Type: {@link xmpText}
		 *
		 * The referenced resource’s `xmpMM:VersionID`.
		 */
		versionID: {
			valueType: xmpText,
		},
	},
};
