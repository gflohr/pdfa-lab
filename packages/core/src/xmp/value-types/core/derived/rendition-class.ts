import * as v from 'valibot';
import { rdfLiteral } from '../../../../rdf/rdf-schema.js';

/**
 * A simple text Open Choice value denoting the form or intended usage of a
 * resource. A series of colon- separated (":", U+003A) tokens and parameters,
 * the first of which names the basic usage of the rendition. Additional tokens
 * need not be present; they provide specific characteristics of the rendition.
 *
 * The following table lists defined values:
 *
 * | Token       | Defined Value                                              |
 * |-------------|------------------------------------------------------------|
 * | `default`   | The master resource; no additional tokens allowed.         |
 * | `draft`.    | A review rendition.                                        |
 * | `low-res`   | A low-resolution, full-size stand-in.                      |
 * | `proof`     | A review proof.                                            |
 * | `screen`    | Screen resolution or Web rendition.                        |
 * | `thumbnail` | A simplified or reduced preview. Additional tokens can     |
 * |             | provide characteristics. The recommended order is:         |
 * |             | `thumbnail`:*format:size:colorspace*.                      |
 * |             |                                                            |
 * |             | EXAMPLE:                                                   |
 * |             | `thumbnail:jpeg, thumbnail:16x16, thumbnail:gif:8x8:bw`    |
 */
export const xmpRenditionClass = rdfLiteral('RenditionClass', [
	v.regex(
		/^(?:default|(?!default:)[^:\s]+(?::[^:\s]+)*)$/,
		'Invalid XMP RenditionClass: must be "default" or a colon-separated series of tokens',
	),
]);
