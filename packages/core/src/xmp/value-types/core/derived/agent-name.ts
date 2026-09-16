import * as v from 'valibot';
import { rdfLiteral } from '../../../../rdf/rdf-schema.js';

/**
 * The name of an XMP processor, a {@link XmpText} value.
 *
 * It is recommended that the value use this format convention:
 *
 * 	Organization Software_name Version (token;token;...)
 *
 * * Organization: The name of the company or organization providing the software, no SPACEs.
 * * Software_name: The full name of the software, SPACEs allowed.
 * * version: The version of the software, no SPACEs.
 * * tokens: Can be used to identify an operating system, plug-in, or more detailed version information.
 *
 * EXAMPLE "Adobe Acrobat 9.0 (Mac OS X 10.5)"
 */
export const xmpAgentName = rdfLiteral('AgentName', [
	v.regex(/^[^ \t]+[ \t]+[^ \t]+[ \t]+[^ \t]+[ \t]*\(.+\)$/),
]);
