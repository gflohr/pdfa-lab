import { rdfBag, rdfLangAlt, rdfSeq } from '../../rdf/rdf-schema.js';
import { xmpDate } from '../value-types/core/basic/date.js';
import { xmpText } from '../value-types/core/basic/text.js';
import { xmpLocale } from '../value-types/core/derived/locale.js';
import { xmpMIMEType } from '../value-types/core/derived/mime-type.js';
import { xmpProperName } from '../value-types/core/derived/proper-name.js';
import type { XmpSchema } from '../xmp-schema.js';

/**
 * Dublin Core namespace.
 *
 * The Dublin Core namespace provides a set of commonly used properties. The
 * names and usage shall be as defined in the Dublin Core Metadata Element Set,
 * created by the Dublin Core Metadata Initiative (DCMI).
 *
 * The namespace URI shall be `http://purl.org/dc/elements/1.1/`.
 * The preferred namespace prefix is `dc`.
 *
 * **NOTE 1:** The Dublin Core elements as defined by DCMI all have URIs of the
 * form "http://purl.org/dc/elements/1.1/<name>" where the <name> part differs.
 *
 * The Dublin Core elements are defined in XMP as properties using the
 * namespace URI "http://purl.org/dc/elements/1.1/"; the local names are the
 * leaf part of the DCMI URI.
 *
 * The XMP data modelling of these is consistent with the apparent Dublin Core
 * intent, but specific to XMP.
 * As a corollary of the data modelling, the RDF serialization of Dublin Core
 * in XMP might not exactly match other RDF usage of the Dublin Core element
 * set.
 *
 * XMP does not "include Dublin Core" in any fuller sense.
 *
 * The listed properties, if used, shall be of the specified types. The
 * property content should be as described.
 *
 * In the listed properties, the property content has subsections for the DCMI
 * definition and comment, plus an XMP addition. The DCMI definition and
 * comment text come directly from the Dublin Core Metadata Element Set. The
 * XMP addition is specific to the XMP specification.
 */
export const dublinCoreSchema: XmpSchema = {
	name: 'Dublin Core',
	namespaceURI: 'http://purl.org/dc/elements/1.1/',
	prefix: 'dc',
	properties: {
		/**
		 * Type: Unordered array of {@link xmpProperName}.
		 *
		 * **DCMI definition**: An entity responsible for making contributions to
		 * the resource. **DCMI comment**: Examples of a contributor include a
		 * person, an organization, or a service. Typically, the name of a
		 * contributor should be used to indicate the entity. **XMP addition**:
		 * XMP usage is a list of contributors. These contributors should not
		 * include those listed in dc:creator.
		 */
		contributor: {
			valueType: rdfBag(xmpProperName),
		},

		/**
		 * Type: {@link xmpText}.
		 *
		 * **DCMI definition**: The spatial or temporal topic of the resource, the
		 * spatial applicability of the resource, or the jurisdiction under which
		 * the resource is relevant. **XMP addition**: XMP usage is the extent or
		 * scope of the resource.
		 */
		coverage: {
			valueType: xmpText,
		},

		/**
		 * Type: Ordered array of {@link xmpProperName}.
		 *
		 * **DCMI definition**: An entity primarily responsible for making the
		 * resource. **DCMI comment**: Examples of a creator include a person, an
		 * organization, or a service. Typically, the name of a creator should be
		 * used to indicate the entity. **XMP addition**: XMP usage is a list of
		 * creators. Entities should be listed in order of decreasing precedence,
		 * if such order is significant.
		 */
		creator: {
			valueType: rdfSeq(xmpProperName),
		},
		/**
		 * Type: Ordered array of ({@link xmpDate}).
		 *
		 * **DCMI definition**: A point or period of time associated with an event
		 * in the life cycle of the resource.
		 */
		date: {
			valueType: rdfSeq(xmpDate),
		},

		/**
		 * Type: Language alternative of {@link xmpText}.
		 *
		 * **DCMI definition**: An account of the resource. **XMP addition**: XMP
		 * usage is a list of textual descriptions of the content of the resource,
		 * given in various languages.
		 */
		description: {
			valueType: rdfLangAlt(),
		},

		/**
		 * Type: {@link xmpMIMEType}.
		 *
		 * **DCMI definition**: The file format, physical medium, or dimensions of
		 * the resource. **DCMI comment**: Examples of dimensions include size and
		 * duration. Recommended best practice is to use a controlled vocabulary
		 * such as the list of Internet Media Types [MIME]. **XMP addition**:
		 * XMP usage is a MIME type. Dimensions would be stored using a
		 * media-specific property, beyond the scope of this document.
		 */
		format: {
			valueType: xmpMIMEType,
		},

		/**
		 * Type: {@link xmpText}.
		 *
		 * **DCMI definition**: An unambiguous reference to the resource within a
		 * given context. **DCMI comment**: Recommended best practice is to
		 * identify the resource by means of a string conforming to a formal
		 * identification system.
		 */
		identifier: {
			valueType: xmpText,
		},

		/**
		 * Type: Unordered array of {@link xmpLocale}.
		 *
		 * **DCMI definition**: A language of the resource. **XMP addition**: XMP
		 * usage is a list of languages used in the content of the resource.
		 */
		language: {
			valueType: rdfBag(xmpLocale),
		},

		/**
		 * Type: Unordered array of {@link xmpProperName}.
		 *
		 * **DCMI definition**: An entity responsible for making the resource
		 * available. **DCMI comment**: Examples of a publisher include a person,
		 * an organization, or a service. Typically, the name of a publisher should
		 * be used to indicate the entity. XMP addition: XMP usage is a list of
		 * publishers.
		 */
		publisher: {
			valueType: rdfBag(xmpProperName),
		},

		/**
		 * Type: Unordered array of {@link xmpText}.
		 *
		 * **DCMI definition**: A related resource. **DCMI comment**: Recommended
		 * best practice is to identify the related resource by means of a string
		 * conforming to a formal identification system. **XMP addition**: XMP
		 * usage is a list of related resources.
		 */
		relation: {
			valueType: rdfBag(xmpText),
		},

		/**
		 * Type: Language alternative of {@link xmpText}.
		 *
		 * **DCMI definition**: Information about rights held in and over the
		 * resource. **DCMI comment**: Typically, rights information includes a
		 * statement about various property rights associated with the resource,
		 * including intellectual property rights. **XMP addition**: XMP usage is a
		 * list of informal rights statements, given in various languages.
		 */
		rights: {
			valueType: rdfLangAlt(),
		},

		/**
		 * Type: {@link xmpText}.
		 *
		 * **DCMI definition**: A related resource from which the described resource
		 * is derived. **DCMI comment**: The described resource may be derived
		 * from the related resource in whole or in part. Recommended best practice
		 * is to identify the related resource by means of a string conforming to a
		 * formal identification system.
		 */
		source: {
			valueType: xmpText,
		},

		/**
		 * Type: Unordered array of {@link xmpText}.
		 *
		 * **DCMI definition**: The topic of the resource. **DCMI comment**:
		 * Typically, the subject will be represented using keywords, key phrases,
		 * or classification codes. Recommended best practice is to use a
		 * controlled vocabulary. To describe the spatial or temporal topic of the
		 * resource, use the dc:coverage element. **XMP addition**: XMP usage is a
		 * list of descriptive phrases or keywords that specify the content of the
		 * resource.
		 */
		subject: {
			valueType: rdfBag(xmpText),
		},

		/**
		 * Type: Language alternative of {@link xmpText}.
		 *
		 * **DCMI definition**: A name given to the resource. **DCMI comment**:
		 * Typically, a title will be a name by which the resource is formally
		 * known. **XMP addition**: XMP usage is a title or name, given in various
		 * languages.
		 */
		title: {
			valueType: rdfLangAlt(),
		},

		/**
		 * Type: Unordered array of {@link xmpText}.
		 *
		 * **DCMI definition: The nature or genre of the resource. **DCMI
		 * comment**: Recommended best practice is to use a controlled vocabulary
		 * such as the DCMI Type Vocabulary [DCMITYPE]. To describe the file
		 * format, physical medium, or dimensions of the resource, use the
		 * `dc:format` element. **XMP addition**: See the `dc:format` entry for
		 * clarification of the XMP usage of that element.
		 */
		type: {
			valueType: rdfBag(xmpText),
		},
	},
};
