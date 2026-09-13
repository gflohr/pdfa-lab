import { xmpInteger } from '../value-types/core/basic/integer.js';
import { xmpText } from '../value-types/core/basic/text.js';
import { xmpAgentName } from '../value-types/core/derived/agent-name.js';
import { xmpGUID } from '../value-types/core/derived/guid.js';
import { xmpPantry } from '../value-types/core/derived/pantry.js';
import { xmpRenditionClass } from '../value-types/core/derived/rendition-class.js';
import { xmpResourceEvent } from '../value-types/core/derived/resource-event.js';
import { xmpResourceRef } from '../value-types/core/derived/resource-ref.js';
import { xmpURI } from '../value-types/core/derived/uri.js';
import { xmpURL } from '../value-types/core/derived/url.js';
import { xmpVersion } from '../value-types/core/derived/version.js';
import { type XmpSchema, xmpBag, xmpSeq } from '../xmp-schema.js';

/**
 * The XMP Media Management namespace
 *
 * This namespace is primarily for use by digital asset management (DAM)
 * systems.
 * The following properties are “owned” by the DAM system and should be set by
 * applications under their direction; they should not be used by unmanaged
 * files: `xmpMM:ManagedFrom`, `xmpMM:Manager`, `xmpMM:ManageTo`,
 * `xmpMM:ManageUI`, `xmpMM: ManagerVariant`.
 *
 * The following properties are owned by the DAM system for managed files, but
 * can also be used by applications for unmanaged files: `xmpMM:DerivedFrom`,
 * `xmpMM:DocumentID`, `xmpMM: RenditionClass`, `xmpMM:RenditionParams`,
 * `xmpMM:VersionID`, `xmpMM:Versions`.
 *
 * The `xmpMM:History` property is always owned by the application.
 *
 * * The namespace URI is http://ns.adobe.com/xap/1.0/mm/
 * * The preferred namespace prefix is `xmpMM`.
 */
export const xmpMediaManagementSchema: XmpSchema = {
	name: 'XMP Media Management',
	namespaceURI: 'http://ns.adobe.com/xap/1.0/mm/',
	prefix: 'xmpMM',
	properties: {
		/**
		 * Type: {@link xmpResourceRef}
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		DerivedFrom: {
			valueType: xmpResourceRef,
		},

		/**
		 * Type: {@link xmpGUID}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		DocumentID: {
			valueType: xmpGUID,
		},

		/**
		 * Type: Ordered array of {@link xmpResourceEvent}.
		 *
		 * High-level actions that resulted in this resource. It is intended to
		 * give human readers a description of the steps taken to make the changes
		 * from the previous version to this one. The list should be at an abstract
		 * level; it is not intended to be an exhaustive keystroke or other
		 * detailed history. The description should be sufficient for metadata
		 * management, as well as for workflow enhancement.
		 */
		History: {
			valueType: xmpSeq(xmpResourceEvent),
		},

		/**
		 * Type: Unordered array of {@link xmpResourceRef}.
		 *
		 * References to resources that were incorporated, by inclusion or
		 * reference, into this resource.
		 */
		Ingredients: {
			valueType: xmpBag(xmpResourceRef),
		},

		/**
		 * Type: {@link xmpGUID}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		InstanceID: {
			valueType: xmpGUID,
		},

		/**
		 * Type: Unordered array of {@link xmpResourceRef}.
		 *
		 * A reference to the document as it was prior to becoming managed. It is
		 * set when a managed document is introduced to an asset management system
		 * that does not currently own it. It may or may not include references to
		 * different management systems.
		 */
		ManagedFrom: {
			valueType: xmpBag(xmpResourceRef),
		},

		/**
		 * Type: {@link xmpAgentName}.
		 *
		 * The name of the asset management system that manages this resource.
		 * Along with `xmpMM:ManagerVariant`, it tells applications which asset
		 * management system to contact concerning this document.
		 */
		Manager: {
			valueType: xmpAgentName,
		},

		/**
		 * Type: {@link xmpURI}.
		 *
		 * A URI identifying the managed resource to the asset management system;
		 * the presence of this property is the formal indication that this
		 * resource is managed. The form and content of this URI is private to the
		 * asset management system.
		 */
		ManageTo: {
			valueType: xmpURI,
		},

		/**
		 * Type: {@link xmpURI}.
		 *
		 * A URI that can be used to access information about the managed resource
		 * through a web browser. It might require a custom browser plug-in.
		 */
		ManageUI: {
			valueType: xmpURI,
		},

		/**
		 * Type: {@link xmpText}.
		 *
		 * Specifies a particular variant of the asset management system. The
		 * format of this property is private to the specific asset management
		 * system.
		 */
		ManagerVariant: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpGUID}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		OriginalDocumentID: {
			valueType: xmpGUID,
		},

		/**
		 * Type: Unordered array of {@link xmpPan}.
		 *
		 * Each array item has a structure value with a potentially unique set of
		 * fields, containing extracted XMP from a component. Each field is a
		 * property from the XMP of a contained resource component, with all
		 * substructure preserved.
		 *
		 * Each pantry entry shall contain an `xmpMM:InstanceID`. Only one copy of
		 * the pantry entry for any given xmpMM:InstanceID shall be retained in the
		 * pantry. Nested pantry items shall be removed from the individual pantry
		 * item and promoted to the top level of the pantry.
		 */
		Pantry: {
			valueType: xmpPantry,
		},

		/**
		 * Type: {@link xmpRenditionClass}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		RenditionClass: {
			valueType: xmpRenditionClass,
		},

		/**
		 * Type: {@link xmpText}.
		 *
		 * Refer to Part 1 of the XMP specification, *Data Model, Serialization,
		 * and Core Properties*, for definition.
		 */
		RenditionParams: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpText}.
		 * The document version identifier for this resource.
		 *
		 * Each version of a document gets a new identifier, usually simply by
		 * incrementing integers 1, 2, 3 . . . and so on.
		 *
		 * Media management systems can have other conventions or support branching
		 * which requires a more complex scheme.
		 */
		VersionID: {
			valueType: xmpText,
		},

		/**
		 * Type: Ordered array of {@link xmpVersion}.
		 *
		 * The version history associated with this resource. Entry [1] is the
		 * oldest known version for this document, entry [last()] is the most
		 * recent version.
		 *
		 * Typically, a media management system would fill in the version
		 * information in the metadata on check-in.
		 *
		 * It is not guaranteed that a complete history of versions from the first
		 * to this one will be present in the `xmpMM:Versions` property. Interior
		 * version information can be compressed or eliminated and the version
		 * history can be truncated at some point.
		 */
		Versions: {
			valueType: xmpSeq(xmpVersion),
		},

		/**
		 * Type: {@link xmpURL}.
		 *
		 * @deprecated for privacy protection.
		 */
		LastURL: {
			valueType: xmpURL,
		},

		/**
		 * Type: {@link xmpResourceRef}.
		 *
		 * @deprecated in favour of `xmpMM:DerivedFrom`.
		 *
		 * A reference to the document of which this is a rendition.
		 */
		RenditionOf: {
			valueType: xmpResourceRef,
		},

		/**
		 * Type: {@link xmpInteger}.
		 *
		 * @deprecated Previously used only to support the `xmpMM:LastURL` property.
		 */
		SaveID: {
			valueType: xmpInteger,
		},
	},
};
