import { rdfLiteral } from '../../../../rdf/rdf-schema.js';

/**
 * A value chosen from a vocabulary of values. Vocabularies provide a means of
 * specifying a limited and possibly extensible set of values for a property.
 *
 * A choice can be open or closed:
 *
 * * An open choice has one or more lists of preferred values, but other values can be used freely.
 * * A closed choice has one or more lists of allowed values, other values shall not be used.
 *
 * This value type represents an open choice. Use the factory function
 * {@link xmpClosedChoice} for a closed choice.
 *
 * NOTE An XMP reader would be more robust if it tolerated unexpected values
 * for closed choice types when the set of allowed values can be expected to
 * grow over time.
 */
export const xmpChoice = rdfLiteral('Choice');
