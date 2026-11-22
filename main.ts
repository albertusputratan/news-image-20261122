import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const run = spawnSync(process.execPath, [join(root, 'render', 'build.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
if (run.status !== 0) process.exit(run.status ?? 1);

const src = join(root, 'entry.png');
if (existsSync(src)) {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  try {
    mkdirSync(outDir, { recursive: true });
    copyFileSync(src, join(outDir, 'entry.png'));
  } catch (err) {
    if (err.code !== 'EROFS' && err.code !== 'EACCES' && err.code !== 'EPERM') throw err;
  }
}
