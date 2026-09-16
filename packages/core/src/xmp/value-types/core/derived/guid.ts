import { rdfLiteral } from '../../../../rdf/rdf-schema.js';

/**
 * A string representing a "**g**lobally **u**nique **i**dentifier”. A GUID
 * shall be a normal (non-URI) simple value, even though it might appear
 * similar to a URI string. This document does not require any particular
 * methodology for creating a GUID, nor does it require any specific means of
 * formatting the GUID as a simple XMP value. The only valid operations on
 * GUIDs are to create them, to assign one to another, and to compare two of
 * them for equality. This comparison shall use the Unicode string value as-is,
 * using a direct byte-for-byte check for equality.
 */
export const xmpGUID = rdfLiteral('GUID');
