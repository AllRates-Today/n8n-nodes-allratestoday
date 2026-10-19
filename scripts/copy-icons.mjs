// Copies node/credential icons (svg, png) into dist/ next to the compiled files.
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOTS = ['nodes', 'credentials'];
let copied = 0;

function walk(dir) {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			walk(full);
		} else if (/\.(svg|png)$/i.test(entry)) {
			const dest = join('dist', full);
			mkdirSync(dirname(dest), { recursive: true });
			copyFileSync(full, dest);
			copied++;
		}
	}
}

for (const root of ROOTS) {
	try {
		walk(root);
	} catch {
		/* directory may not exist */
	}
}
console.log(`copied ${copied} icon file(s) into dist/`);
