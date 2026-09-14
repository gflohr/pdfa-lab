import type { RdfProperty } from '../rdf/rdf-schema.js';
import { xmpDimensions } from './value-types/complex/dimensions.js';
import { xmpBoolean } from './value-types/core/basic/boolean.js';
import { xmpDate } from './value-types/core/basic/date.js';
import { xmpInteger } from './value-types/core/basic/integer.js';
import { xmpReal } from './value-types/core/basic/real.js';
import { xmpText } from './value-types/core/basic/text.js';
import { xmpChoice } from './value-types/core/derived/choice.js';
import { xmpGUID } from './value-types/core/derived/guid.js';
import { xmpLocale } from './value-types/core/derived/locale.js';
import { xmpMIMEType } from './value-types/core/derived/mime-type.js';
import { xmpPart } from './value-types/core/derived/part.js';
import { xmpProperName } from './value-types/core/derived/proper-name.js';
import { xmpRenditionClass } from './value-types/core/derived/rendition-class.js';
import { xmpResourceRef } from './value-types/core/derived/resource-ref.js';
import { xmpURI } from './value-types/core/derived/uri.js';
import { xmpURL } from './value-types/core/derived/url.js';

export const xmpCoreBaseTypes = {
	boolean: xmpBoolean,
	date: xmpDate,
	integer: xmpInteger,
	real: xmpReal,
	text: xmpText,
} as const;

export type XmpCoreBaseType =
	| keyof typeof xmpCoreBaseTypes
	| 'alt'
	| 'bag'
	| 'seq'
	| 'lang alt';

export const xmpCoreDerivedTypes = {
	agentname: xmpBoolean,
	choice: xmpChoice,
	guid: xmpGUID,
	locale: xmpLocale,
	mimetype: xmpMIMEType,
	part: xmpPart,
	propername: xmpProperName,
	RenditionClass: xmpRenditionClass,
	ResourceRef: xmpResourceRef,
	URI: xmpURI,
	URL: xmpURL,
} as const;
export type XmpCoreDerivedType = keyof typeof xmpCoreDerivedTypes;

export const xmpComplexTypes = {
	Dimensions: xmpDimensions,
};
export type XmpComplexType = keyof typeof xmpComplexTypes;

export type XmpCoreType = XmpCoreBaseType | XmpCoreDerivedType;

export type XmpPredefinedType = XmpCoreType | XmpComplexType;

export interface XmpSchema {
	name: string;
	namespaceURI: string;
	prefix: string;
	properties: Record<string, RdfProperty>;
}
