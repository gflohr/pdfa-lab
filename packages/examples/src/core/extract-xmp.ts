import * as fs from 'node:fs/promises';
import { PDFALab } from '@pdfa-lab/core';

if (process.argv.length < 3) {
	console.error(`Usage: ${process.argv[1]} FILENAME`);
	process.exit(1);
}

extract(process.argv[2]!).catch((err) => {
	console.error(`Extracting meta information failed: ${err}`);
	process.exit(1);
});

async function extract(filename: string) {
	const bytes = await fs.readFile(filename);
	const lab = await PDFALab.from(bytes);
	const output = await lab.extractXmp(
		'text/turtle',
		'http://example.com/sample',
		{ flags: 'o' },
	);
	console.log(output);
}
