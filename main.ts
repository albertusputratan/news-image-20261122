import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const sourcePng = join(root, 'entry.png');

if (!existsSync(sourcePng)) {
  process.exit(1);
}

try {
  mkdirSync(outDir, { recursive: true });
  copyFileSync(sourcePng, join(outDir, 'entry.png'));
} catch {
  process.exit(1);
}

process.exit(0);
