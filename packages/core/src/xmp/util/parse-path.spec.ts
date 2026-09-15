import { describe, expect, it } from 'vitest';
import { parsePath, PathToken } from './parse-path.js';

describe('XMP Path Parser', () => {
	it('should parse a single component path', () => {
		const path = 'xy:person';
		expect(parsePath(path)).toStrictEqual([
			{
				prefix: 'xy',
				name: 'person',
			},
		]);
	});

	it('should parse a simple path', () => {
		const path = 'xy:person/xy:name';
		expect(parsePath(path)).toStrictEqual([
			{
				prefix: 'xy',
				name: 'person',
			},
			{
				prefix: 'xy',
				name: 'name',
			},
		]);
	});

	it('should inherit a prefix from the parent', () => {
		const path = 'xy:person/name';
		expect(parsePath(path)).toStrictEqual([
			{
				prefix: 'xy',
				name: 'person',
			},
			{
				prefix: 'xy',
				name: 'name',
			},
		]);
	});

	it('should throw an exception for a missing top-level prefix', () => {
		const path = 'person/name';
		expect(() => parsePath(path)).toThrow(
			'The first path element must have a namespace prefix!',
		);
	});

	it('should throw an exception for a lone colon following a valid path element', () => {
		expect(() => parsePath('dc:foo/:')).toThrow(
			'Empty element names are not allowed!',
		);
	});

	it('should discard the root', () => {
		const path = '/xy:person/name';
		expect(parsePath(path)).toStrictEqual([
			{
				prefix: 'xy',
				name: 'person',
			},
			{
				prefix: 'xy',
				name: 'name',
			},
		]);
	});

	it('should extract a numerical index', () => {
		const path = '/xy:person[1]/name';
		expect(parsePath(path)).toStrictEqual([
			{
				prefix: 'xy',
				name: 'person',
				index: 1,
			},
			{
				prefix: 'xy',
				name: 'name',
			},
		]);
	});

	it.skip('should extract a language tag', () => {
		const path = '/xy:person/name@bg-BG';
		expect(parsePath(path)).toStrictEqual([
			{
				prefix: 'xy',
				name: 'person',
			},
			{
				prefix: 'xy',
				name: 'name',
				lang: 'bg-BG',
			},
		]);
	});

	it('should allow empty indices', () => {
		const path = '/xy:person[]/name';
		const wanted: PathToken[] = [
			{
				prefix: 'xy',
				name: 'person',
				index: '',
			},
			{
				prefix: 'xy',
				name: 'name',
			}
		];
		expect(parsePath(path)).toStrictEqual(wanted);
	});

	it('should allow negative indices', () => {
		const path = '/xy:person[-1]/name';
		const wanted: PathToken[] = [
			{
				prefix: 'xy',
				name: 'person',
				index: -1,
			},
			{
				prefix: 'xy',
				name: 'name',
			}
		];
		expect(parsePath(path)).toStrictEqual(wanted);
	});

	it('should ignore empty path elements', () => {
		const path = 'xy:foo//bar';
		expect(parsePath(path)).toStrictEqual([
			{
				prefix: 'xy',
				name: 'foo',
			},
			{
				prefix: 'xy',
				name: 'bar',
			},
		]);
	});

	it('should throw an exception for indexed empty path elements', () => {
		expect(() => parsePath('xy:foo/[1]/bar')).toThrow(
			'Empty element names are not allowed',
		);
	});

	it('should throw an exception for invalid language tags', () => {
		expect(() => parsePath('xy:foo@de%de/bar')).toThrow(
			"Invalid language tag 'de%de'",
		);
	});
});
