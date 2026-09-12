import type * as v from 'valibot';
import { xmpBoolean } from './data-types/boolean.js';
import { xmpInteger } from './data-types/integer.js';
import { xmpDimensions } from './value-types/complex/dimensions.js';
import { xmpDate } from './value-types/core/basic/date.js';
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

export interface XmpBaseValueType {
	termType: string;

	/**
	 * Description. Verbose description of the type. Defaults to its name.
	 */
	description?: string;

	/**
	 * Valibot validation actions like v.regex() or v.minLength().
	 */
	validationActions?: v.GenericPipeAction[];

	/**
	 * If false, the validationActions are only checked in strict mode.
	 * Default `false`.
	 */
	strict?: boolean;
}

export interface XmpLiteral extends XmpBaseValueType {
	termType: 'Literal';

	/**
	 * The name of the value type.
	 */
	name: string;
}

/**
 * Factory function for {@link XmpLiteral}.
 *
 * @param name the name like 'Text', 'Date', etc.
 * @param validationActions possible validation actions
 * @param strict enforce validation actions
 * @param internal if internal or external
 * @returns
 */
export function xmpLiteral(
	name: string,
	validationActions?: v.GenericPipeAction[],
	strict?: boolean,
): XmpLiteral {
	return {
		name,
		termType: 'Literal',
		validationActions,
		strict,
	};
}

export interface XmpStruct extends XmpBaseValueType {
	name: string;

	termType: 'Struct';

	namespaceURI: string;

	prefix: string;

	/** Fields contained inside this structured custom type. */
	properties: Record<string, XmpProperty>;
}

export interface XmpBag<T = XmpLiteral> extends XmpBaseValueType {
	termType: 'Bag';

	itemType: T;
}

export function xmpBag<T extends XmpValueType = XmpLiteral>(
	itemType: T,
): XmpBag<T> {
	return {
		termType: 'Bag',

		itemType,
	};
}

export interface XmpSeq<T extends XmpValueType> extends XmpBaseValueType {
	termType: 'Seq';

	itemType: T;
}

export function xmpSeq<T extends XmpValueType = XmpLiteral>(
	itemType: T,
): XmpSeq<T> {
	return {
		termType: 'Seq',
		itemType,
	};
}
export interface XmpAlt<T extends XmpValueType> extends XmpBaseValueType {
	termType: 'Alt';
	qualifierPrefix: string;
	qualifier: string;
	itemType: T;
}
export function xmpAlt<T extends XmpValueType = XmpLiteral>(
	itemType: T,
	qualifierPrefix: string,
	qualifier: string,
): XmpAlt<T> {
	return {
		termType: 'Alt',
		qualifierPrefix,
		qualifier,
		itemType,
	};
}

export function xmpLangAlt<T extends XmpValueType = XmpLiteral>(itemType: T) {
	return xmpAlt<T>(itemType, 'xml', 'lang');
}

export type XmpList<T extends XmpValueType = XmpLiteral> =
	| XmpBag
	| XmpSeq<T>
	| XmpAlt<T>;
export type XmpValueType = XmpLiteral | XmpStruct | XmpList;

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

export interface XmpProperty {
	description?: string;

	valueType: XmpValueType;

	/*
	 * Does the property have to be present? Default: `false`.
	 */
	required?: boolean;

	/**
	 * The opposite of external. Default: `false`. That means that properties
	 * are by default external.
	 */
	internal?: boolean;
}

export interface XmpSchema {
	name: string;
	namespaceURI: string;
	prefix: string;
	properties: Record<string, XmpProperty>;
}
