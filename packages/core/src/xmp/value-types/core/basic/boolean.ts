import * as v from 'valibot';
import { rdfLiteral } from '../../../../rdf/rdf-schema.js';

/**
 * Boolean values shall be "True" or "False".
 */
export const xmpBoolean = rdfLiteral('Boolean', [v.regex(/^True|False$/)]);
