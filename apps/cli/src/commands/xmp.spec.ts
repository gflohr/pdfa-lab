import { PDFALab } from '@pdfa-lab/core';
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from 'vitest';
import type { Arguments } from 'yargs';
import { coerceOptions } from '../util/optspec.js';
import { XMPCommand } from './xmp.js';

vi.mock('../util/optspec.js');
vi.mock('./load-input.js', () => ({
	loadInput: vi.fn().mockResolvedValue(new Uint8Array()),
}));
vi.mock('@pdfa-lab/core', async (importActual) => {
	const actual = await importActual<typeof import('@pdfa-lab/core')>();
	return {
		...actual,
		PDFALab: {
			from: vi.fn(),
		},
	};
});

describe('XMP Command', () => {
	let xmpCommand: XMPCommand;

	beforeEach(() => {
		xmpCommand = new XMPCommand();
		(coerceOptions as Mock).mockReturnValue(true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('description() should return a valid description', () => {
		expect(xmpCommand.description()).toBe(
			'Show or manipulate XMP meta information of a PDF document.',
		);
	});

	it('aliases() should return an empty array', () => {
		expect(xmpCommand.aliases()).toEqual([]);
	});

	it('options() should return options', () => {
		const options = xmpCommand.options();

		expect(options).toBeDefined();
	});

	it('run() should return 1 if coerceOptions fails', async () => {
		(coerceOptions as Mock).mockReturnValue(false);
		const result = await xmpCommand.run(Buffer.from(''), {} as Arguments);

		expect(result).toBe(1);
	});

	it('run() should call extractXmp and return 0 on success', async () => {
		const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const extractXmpMock = vi.fn().mockReturnValue('abc');
		(PDFALab.from as Mock).mockResolvedValue({
			extractXmp: extractXmpMock,
		});

		const result = await xmpCommand.run(Buffer.from(''), {
			format: 'xml',
		} as unknown as Arguments);

		expect(extractXmpMock).toHaveBeenCalledTimes(1);
		expect(result).toBe(0);
		expect(consoleLogSpy).toHaveBeenCalledTimes(1);
		expect(consoleLogSpy).toHaveBeenCalledWith('abc');
	});

	describe('Serialisation Format Aliases', () => {
		let consoleLogSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should allow 'xml' as an alias for 'application/rdf+xml'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'xml',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith(
				'application/rdf+xml',
				undefined,
				{ flags: undefined },
			);
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});

		it("should allow 'rdf+xml' as an alias for 'application/rdf+xml'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'rdf+xml',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith(
				'application/rdf+xml',
				undefined,
				{ flags: undefined },
			);
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});

		it("should allow 'N3' as an alias for 'text/n3'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'N3',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith('text/n3', undefined, {
				flags: undefined,
			});
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});

		it("should allow 'Notation3' as an alias for 'text/n3'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'Notation3',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith('text/n3', undefined, {
				flags: undefined,
			});
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});

		it("should allow 'Turtle' as an alias for 'text/turtle'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'Turtle',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith('text/turtle', undefined, {
				flags: undefined,
			});
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});

		it("should allow 'N-Triples' as an alias for 'application/n-triples'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'N-Triples',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith(
				'application/n-triples',
				undefined,
				{ flags: undefined },
			);
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});

		it("should allow 'nquads' as an alias for 'application/nquads'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'nquads',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith(
				'application/nquads',
				undefined,
				{ flags: undefined },
			);
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});

		it("should allow 'json-ld' as an alias for 'application/ld+json'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'json-ld',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith(
				'application/ld+json',
				undefined,
				{ flags: undefined },
			);
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});

		it("should allow 'ld+json' as an alias for 'application/ld+json'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'ld+json',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith(
				'application/ld+json',
				undefined,
				{ flags: undefined },
			);
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});

		it("should allow 'json' as an alias for 'application/ld+json'", async () => {
			const extractXmpMock = vi.fn().mockReturnValue('abc');
			(PDFALab.from as Mock).mockResolvedValue({
				extractXmp: extractXmpMock,
			});

			await xmpCommand.run(Buffer.from(''), {
				format: 'json',
			} as unknown as Arguments);

			expect(extractXmpMock).toHaveBeenCalledTimes(1);
			expect(extractXmpMock).toHaveBeenCalledWith(
				'application/ld+json',
				undefined,
				{ flags: undefined },
			);
			expect(consoleLogSpy).toHaveBeenCalledTimes(1);
			expect(consoleLogSpy).toHaveBeenCalledWith('abc');
		});
	});
});
