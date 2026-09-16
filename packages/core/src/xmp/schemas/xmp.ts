import { rdfBag } from '../../rdf/rdf-schema.js';
import { xmpDate } from '../value-types/core/basic/date.js';
import { xmpText } from '../value-types/core/basic/text.js';
import { xmpAgentName } from '../value-types/core/derived/agent-name.js';
import type { XmpSchema } from '../xmp-schema.js';

/**
 * XMP Namespace
 *
 * The XMP basic namespace contains properties that provide basic descriptive
 * information.
 *
 * * The namespace URI is http://ns.adobe.com/xap/1.0/
 * * The preferred namespace prefix is `xmp`
 */
export const xmpSchema: XmpSchema = {
	name: 'XMP',
	namespaceURI: 'http://ns.adobe.com/xap/1.0/',
	prefix: 'xmp',
	properties: {
		/**
		 * Type: Unordered array of XPath.
		 *
		 * An unordered array specifying properties that were edited outside the
		 * authoring application.
		 *
		 * Each item should contain a single namespace and XPath separated by one
		 * ASCII space (U+0020).
		 *
		 * @deprecated see XMP specification!
		 */
		Advisory: {
			valueType: rdfBag(xmpText),
		},

		/**
		 * Type: {@link xmpDate}.
		 *
		 * The date and time the resource was created. For a digital file, this
		 * need not match a file-system creation time. For a freshly created
		 * resource, it should be close to that time, modulo the time taken to
		 * write the file. Later file transfer, copying, and so on, can make the
		 * file-system time arbitrarily different.
		 */
		CreateDate: {
			valueType: xmpDate,
		},

		/**
		 * Type: {@link xmpAgentName}.
		 *
		 * The name of the first known tool used to create the resource.
		 */
		CreatorTool: {
			valueType: xmpAgentName,
		},

		/**
		 * Type: Unordered array of {@link xmpText}.
		 *
		 * An unordered array of text strings that unambiguously identify the
		 * resource within a given context. An array item may be qualified with
		 * `xmpidq:Scheme` to denote the formal identification system to which that
		 * identifier conforms.
		 *
		 * **NOTE:** The `xmp:Identifier` property was added because
		 * `dc:identifier` has been defined in the original XMP specification as a
		 * single identifier instead of as an array, and changing `dc:identifier`
		 * to an array would break compatibility with existing XMP processors.
		 */
		Identifier: {
			valueType: rdfBag(xmpText),
		},

		/**
		 * Type: {@link xmpText}
		 *
		 * A word or short phrase that identifies a resource as a member of a
		 * user-defined collection.
		 *
		 * **NOTE:** One anticipated usage is to organize resources in a file
		 * browser.
		 */
		Label: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpDate}
		 *
		 * The date and time that any metadata for this resource was last changed.
		 * It should be the same as or more recent than `xmp:ModifyDate`.
		 */
		MetadataDate: {
			valueType: xmpDate,
		},

		/**
		 * Type: {@link xmpDate}
		 *
		 * The date and time the resource was last modified.
		 *
		 * **NOTE:** The value of this property is not necessarily the same as the
		 * file’s system modification date because it is typically set before the
		 * file is saved.
		 */
		ModifyDate: {
			valueType: xmpDate,
		},
	},
};
