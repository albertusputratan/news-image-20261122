import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const run = spawnSync(process.execPath, [join(root, 'render', 'build.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
if (run.status !== 0) process.exit(run.status ?? 1);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
copyFileSync(join(root, 'entry.png'), join(outDir, 'entry.png'));
