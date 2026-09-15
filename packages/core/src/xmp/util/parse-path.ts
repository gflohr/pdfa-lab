import { langTagRegex } from './lang-tag-regex.js';

export interface PathToken {
	prefix: string;
	name: string;
	lang?: string;
	index?: number | '';
}

/** @internal */
export function parsePath(path: string): PathToken[] {
	const parts = path.split('/').filter((part) => part.length);

	const tokens: PathToken[] = [];

	let parentPrefix = '';
	parts.forEach((part) => {
		let index: number | '' | undefined;
		const indexMatch = part.match(/\[(.*)\]/);
		if (indexMatch) {
			part = part.substring(0, indexMatch.index);
			if (!indexMatch[1]) {
				index = '';
			} else if (indexMatch[1].match(/^[0-9]+$/)) {
				index = parseInt(indexMatch[1], 10);
				if (index <= 0) {
					throw new Error(
						'XMP paths are 1-based, 0 is not allowed as an index!',
					);
				}
			} else {
				throw new Error(`Invalid index '${indexMatch[1]}'`);
			}
		}

		const langMatch = part.match(/@(.*)/);
		let lang: string | undefined;
		if (langMatch) {
			part = part.substring(0, langMatch.index);
			if (!langMatch[1]?.match(langTagRegex)) {
				throw new Error(`Invalid language tag '${langMatch[1]}'`);
			}
			lang = langMatch[1];
		}

		if (!part.length) {
			throw new Error('Empty element names are not allowed!');
		}

		let [prefix, name] = part.split(':');
		if (!name) {
			name = prefix;
			prefix = parentPrefix;
			if (!prefix.length) {
				throw new Error('The first path element must have a namespace prefix!');
			}
		} else {
			parentPrefix = prefix!;
		}

		if (!name!.length) {
			throw new Error('Empty element names are not allowed!');
		}

		const token: PathToken = { prefix: prefix!, name: name! };
		if (typeof index !== 'undefined') {
			token.index = index;
		}

		if (typeof lang !== 'undefined') {
			token.lang = lang;
		}

		tokens.push(token);
	});

	if (!tokens.length) {
		throw new Error('Empty paths are not allowed!');
	}

	return tokens;
}
