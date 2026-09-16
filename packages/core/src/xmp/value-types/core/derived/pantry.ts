import { type RdfStruct, rdfBag } from '../../../../rdf/rdf-schema.js';
import { xmpText } from '../basic/text.js';

/**
 * A single sub-asset entry inside xmpMM:Pantry.
 * Represents an rdf:Description node containing metadata for an embedded resource.
 */
export const XmpPantryItem: RdfStruct = {
	name: 'Pantry',
	termType: 'Struct',
	namespaceURI: 'http://ns.adobe.com/xap/1.0/mm/',
	prefix: 'xmpMM',
	properties: {
		InstanceID: {
			valueType: xmpText,
		},
		DocumentID: {
			valueType: xmpText,
		},
		OriginalDocumentID: {
			valueType: xmpText,
		},
	},
};

/**
 * xmpMM:Pantry
 *
 * Type: Unordered array (`rdf:Bag`) of nested XMP Resource descriptions.
 */
export const xmpPantry = rdfBag(XmpPantryItem);
