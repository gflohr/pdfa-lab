import type * as v from 'valibot';

export interface RdfBaseValueType {
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

export interface RdfLiteral extends RdfBaseValueType {
	termType: 'Literal';

	/**
	 * The name of the value type.
	 */
	name: string;
}

/**
 * Factory function for {@link RdfLiteral}.
 *
 * @param name the name like 'Text', 'Date', etc.
 * @param validationActions possible validation actions
 * @param strict enforce validation actions
 * @param internal if internal or external
 * @returns
 */
export function rdfLiteral(
	name: string,
	validationActions?: v.GenericPipeAction[],
	strict?: boolean,
): RdfLiteral {
	return {
		name,
		termType: 'Literal',
		validationActions,
		strict,
	};
}

export interface RdfStruct extends RdfBaseValueType {
	name: string;

	termType: 'Struct';

	namespaceURI: string;

	prefix: string;

	/** Fields contained inside this structured custom type. */
	properties: Record<string, RdfProperty>;
}

export interface RdfBag<T = RdfValueType> extends RdfBaseValueType {
	termType: 'Bag';

	itemType: T;
}

export function rdfBag<T extends RdfValueType>(itemType: T): RdfBag<T> {
	return {
		termType: 'Bag',

		itemType,
	};
}

export interface RdfSeq<T = RdfValueType> extends RdfBaseValueType {
	termType: 'Seq';

	itemType: T;
}

export function rdfSeq<T extends RdfValueType>(itemType: T): RdfSeq<T> {
	return {
		termType: 'Seq',
		itemType,
	};
}

export interface RdfAlt<T = RdfValueType> extends RdfBaseValueType {
	termType: 'Alt';
	itemType: T;
}
export function rdfAlt<T extends RdfValueType>(itemType: T): RdfAlt<T> {
	return {
		termType: 'Alt',
		itemType,
	};
}

/**
 * A Language Alternative is actually definined in the XMP specification, and
 * not part of RDF. The items of a language alternative are always simple
 * text values.
 */
export interface RdfLangAlt extends RdfBaseValueType {
	termType: 'Lang Alt';
}

export function rdfLangAlt(): RdfLangAlt {
	return {
		termType: 'Lang Alt',
	};
}

export type RdfList<T extends RdfValueType> =
	| RdfBag<T>
	| RdfSeq<T>
	| RdfAlt<T>
	| RdfLangAlt;
export type RdfValueType =
	| RdfLiteral
	| RdfStruct
	| RdfBag
	| RdfSeq
	| RdfAlt
	| RdfLangAlt;

export interface RdfProperty {
	description?: string;

	valueType: RdfValueType;

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
