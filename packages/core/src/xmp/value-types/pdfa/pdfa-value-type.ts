import * as v from 'valibot';
import { type RdfStruct, rdfLiteral } from '../../../rdf/rdf-schema.js';
import { xmpText } from '../core/basic/text.js';
import { xmpChoice } from '../core/derived/choice.js';
import { xmpURI } from '../core/derived/uri.js';

/**
 * PDF/A Value Type namespace.
 *
 * The PDF/A ValueType schema is required for all property value types which
 * are not defined in the XMP 2004 specification, i.e. for value types outside
 * of the following list:
 *
 * * Array types (these are container types which may contain one or more fields): {@link xmpAlt}, {@link rdfBag}, {@link rdfSeq}
 * * Basic value types: {@link xmpBoolean}, open {@link xmpChoice}, {@link xmpClosedChoice}, {@link xmpDimensions}, {@link xmpInteger}, `Lang Alt`, {@link xmpLocale}, {@link xmpMIMEType}, {@link xmpProperName}, {@link xmpReal}, {@link xmpText}, {@link xmpThumbnail}, {@link xmpURI}, {@link xmpURL}, {@link xmpXPath}
 * * Media Management value types: {@link xmpAgentName}, {@link xmpRenditionClass}, {@link xmpResourceEvent}, {@link xmpResourceRef}, {@link xmpVersion}
 * * Basic Job/Workflow value type: {@link xmpJob}
 * * EXIF schema value types: {@link xmpFlash}, {@link xmpCFAPattern}, {@link xmpDeviceSettings}, {@link xmpGPSCoordinate}, {@link xmpOECF}, {@link xmpSFR}, {@link xmpRational}
 *
 * * Schema namespace URI: http://www.aiim.org/pdfa/ns/type#
 * * Required schema namespace prefix: `pdfaType`
 */
export const pdfaValueType: RdfStruct = {
	name: 'ValueType',
	termType: 'Struct',
	namespaceURI: 'http://www.aiim.org/pdfa/ns/type#',
	prefix: 'pdfaType',
	properties: {
		/**
		 * Type: {@link xmpText}
		 *
		 * The escription of the property value type.
		 *
		 * Human-readable text.
		 */
		description: {
			description: 'Description of the property value type',
			valueType: xmpText,
		},

		/**
		 * Type: {@link rdfSeq} of {@link pdfaField}
		 *
		 * Optional description of the structured field.
		 *
		 * Separate entries are required for all fields in a structured type.
		 */
		field: {
			valueType: rdfLiteral(
				'name',
				[v.regex(/^[A-Za-z_][A-Za-z0-9_.-]*$/)],
				true,
			),
		},

		/**
		 * Type: {@link xmpURI}
		 *
		 * Property value type field namespace URI.
		 *
		 * This defaults to the parent namespace URI.
		 */
		namespaceURI: {
			valueType: xmpURI,
		},

		/**
		 * Type: {@link xmpText}
		 *
		 * Preferred value type field namespace prefix. This defaults to the
		 * parent prefix.
		 */
		prefix: {
			valueType: xmpText,
		},

		/**
		 * Type: {@link xmpText}
		 *
		 * Property value type name.
		 */
		type: {
			valueType: xmpText,
		},
	},
};
