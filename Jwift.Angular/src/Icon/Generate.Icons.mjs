// Cross-platform wrapper that generates the Jwift icon font.
// - Finds a usable Python ("python" on Windows, "python3" on *nix/CI)
// - Installs fonttools + brotli on first run (cached thereafter)
// - Runs Generate.py (lives next to this file in the Jwift/Icon slice)
//
// Invoked automatically by the prebuild/prestart npm hooks so local dev
// and CI both generate Icon.Data.ts + Icon.Font.woff2 before Angular builds.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const Here = dirname(fileURLToPath(import.meta.url));
const GenerateScript = resolve(Here, 'Generate.py');

function TryRun(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  return result.status;
}

function FindPython() {
  for (const candidate of ['python3', 'python']) {
    const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore', shell: false });
    if (probe.status === 0) return candidate;
  }
  return null;
}

const Python = FindPython();
if (!Python) {
  console.error('[Generate.Icons] Python not found on PATH. Install Python 3.10+ and retry.');
  process.exit(1);
}

// Fast path: deps already installed -> skip pip install entirely.
const HasDeps = spawnSync(Python, ['-c', 'import fontTools, brotli'], { stdio: 'ignore' }).status === 0;
if (!HasDeps) {
  console.log('[Generate.Icons] Installing fonttools + brotli (one-time)...');
  const pipStatus = TryRun(Python, ['-m', 'pip', 'install', '--quiet', '--disable-pip-version-check', 'fonttools', 'brotli']);
  if (pipStatus !== 0) {
    console.error('[Generate.Icons] pip install failed.');
    process.exit(pipStatus ?? 1);
  }
}

const runStatus = TryRun(Python, [GenerateScript]);
process.exit(runStatus ?? 0);
