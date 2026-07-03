// Workaround for prisma-zod-generator: when a model contains a Decimal
// column it emits `z.instanceof(Prisma.Decimal, ...)` without importing
// `Prisma`. We inject the missing import after the zod import line.

const fs = require("node:fs");
const path = require("node:path");

const TARGET = path.join(__dirname, "..", "prisma", "zod", "index.ts");
const IMPORT_LINE = `import { Prisma } from "../generated/client";`;
const MARKER = `import * as z from 'zod';`;

const source = fs.readFileSync(TARGET, "utf8");
if (!source.includes("Prisma.Decimal")) {
	process.exit(0);
}
if (source.includes(IMPORT_LINE)) {
	process.exit(0);
}
if (!source.includes(MARKER)) {
	console.error(
		`patch-zod: could not find marker line "${MARKER}" in ${TARGET}`,
	);
	process.exit(1);
}
const patched = source.replace(MARKER, `${MARKER}\n${IMPORT_LINE}`);
fs.writeFileSync(TARGET, patched);
console.log("patch-zod: injected Prisma import into prisma/zod/index.ts");
