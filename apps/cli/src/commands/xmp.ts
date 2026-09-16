import { Textdomain } from '@esgettext/runtime';
import {
	DEFAULT_BASE_IRI,
	PDFALab,
	type RdfSerialisationFormat,
} from '@pdfa-lab/core';
import type { Arguments, InferredOptionTypes } from 'yargs';
import type { Command } from '../command.js';
import { defaultOptions } from '../default-options.js';
import { coerceOptions, type OptSpec } from '../util/optspec.js';

const gtx = Textdomain.getInstance('pdfa-lab');

const formatAliases: Record<string, RdfSerialisationFormat> = {
	xml: 'application/rdf+xml',
	'rdf+xml': 'application/rdf+xml',
	n3: 'text/n3',
	notation3: 'text/n3',
	turtle: 'text/turtle',
	'n-triples': 'application/n-triples',
	nquads: 'application/nquads',
	'json-ld': 'application/ld+json',
	'ld+json': 'application/ld+json',
	json: 'application/ld+json',
	'application/x-turtle': 'text/turtle',
	'application/n3': 'text/n3',
	'application/n-quads': 'application/nquads',
};
type RdfSerialisationFormatKey = keyof typeof formatAliases;

const formatChoices: (RdfSerialisationFormat | RdfSerialisationFormatKey)[] = [
	'application/rdf+xml',
	'text/n3',
	'text/turtle',
	'application/n-triples',
	'application/nquads',
	'application/ld+json',
];
for (const s in formatAliases) {
	const shortcut = s as RdfSerialisationFormatKey;
	if (!formatChoices.includes(shortcut)) {
		formatChoices.push(shortcut);
	}
	formatChoices.push(formatAliases[shortcut]!);
}

const options: {
	'base-iri': OptSpec;
	format: OptSpec;
	flags: OptSpec;
} = {
	'base-iri': {
		group: gtx._('Mode of Operation'),
		alias: ['b'],
		type: 'string',
		default: DEFAULT_BASE_IRI,
		describe: gtx._('the base IRI'),
	},
	format: {
		group: gtx._('Output format'),
		alias: ['f'],
		type: 'string',
		choices: formatChoices,
		default: 'xml',
		describe: gtx._('the output format'),
	},
	flags: {
		group: gtx._('Output format'),
		type: 'string',
		describe: gtx._('the serialiser flags'),
	},
};

const allOptions = { ...defaultOptions, ...options };
export type ConfigOptions = InferredOptionTypes<typeof allOptions>;

export class XMPCommand implements Command {
	description(): string {
		return gtx._('Show or manipulate XMP meta information of a PDF document.');
	}

	aliases(): Array<string> {
		return [];
	}

	options(): Record<string, OptSpec> {
		return options;
	}

	private resolveFormatAlias(given: string): RdfSerialisationFormat {
		if (typeof formatAliases[given] !== 'undefined') {
			return formatAliases[given];
		} else {
			return given as RdfSerialisationFormat;
		}
	}

	private serialise(lab: PDFALab, configOptions: ConfigOptions) {
		const serialised = lab.extractXmp(
			this.resolveFormatAlias((configOptions.format as string).toLowerCase()),
			configOptions['base-iri'] as string,
			{ flags: configOptions.flags as string },
		);

		if (!serialised) {
			console.error('Document does not contain XMP meta information.');
		}

		console.log(serialised);
	}

	private async doRun(
		input: Buffer,
		configOptions: ConfigOptions,
	): Promise<number> {
		const lab = await PDFALab.from(input);

		this.serialise(lab, configOptions);

		return 0;
	}

	public async run(input: Buffer, argv: Arguments): Promise<number> {
		const configOptions = argv as unknown as ConfigOptions;

		if (!coerceOptions(argv, options)) {
			return 1;
		}

		return await this.doRun(input, configOptions);
	}
}
