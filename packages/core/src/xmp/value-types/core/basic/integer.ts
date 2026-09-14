import * as v from 'valibot';
import { rdfLiteral } from '../../../../rdf/rdf-schema.js';

/**
 * A signed or unsigned numeric string used as an integer number
 * representation. The string consists of an arbitrary-length decimal numeric
 * string with an optional leading "+" or "–" sign.
 */
export const xmpInteger = rdfLiteral('Integer', [v.regex(/^[-+]?[0-9]+$/)]);
