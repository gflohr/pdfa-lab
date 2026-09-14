import * as v from 'valibot';
import { rdfLiteral } from '../../../../rdf/rdf-schema.js';

/**
 * A simple text value denoting a floating-point numeric value, written using=
 * decimal notation of an optional sign followed by an integer part and a
 * fraction part. Either the integer part or the fraction part, but not both,
 * may be omitted. The sign, if present, is "+" (U+002B) or "-" (U+002D). The
 * integer part, if present, is a sequence of one or more decimal digits
 * (U+0030 to U+0039). The fraction, if present, is a decimal point (".",
 * U+002E) followed by a sequence of one or more decimal digits.
 *
 * The precise range and precision for the general type are not specified by
 * this document. If converted to a binary value, an XMP processor shall
 * support at least the 32-bit IEEE 754 range and precision, and it should
 * support at least the 64-bit IEEE 754 range and precision. A particular use
 * of the Real type may specify a required range or precision, such as
 * nonnegative or microsecond resolution (for a duration in seconds).
 */
export const xmpReal = rdfLiteral('Real', [
	v.regex(
		/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/,
		'Invalid XMP Real: must be a valid floating-point number string',
	),
]);
