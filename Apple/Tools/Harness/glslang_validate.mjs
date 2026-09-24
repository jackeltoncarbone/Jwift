import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const SRC = 'C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/src';
const BIN = join(process.cwd(), 'node_modules/glslang-validator-prebuilt-predownloaded/bin/glslangValidator.exe');
const OUT = join(process.cwd(), 'out');
mkdirSync(OUT, { recursive: true });

const read = (p) => readFileSync(join(SRC, p), 'utf8');
const clip = read('Core/Shaders/Clip.Stack.glsl');
const withClip = (s) => s.replace('#pragma ClipStack', clip);
const inject = (src, defines) => {
  const lines = Object.keys(defines).map((k) => `#define ${k}`);
  const m = /^\s*#version[^\n]*\n/.exec(src);
  return src.slice(0, m.index + m[0].length) + lines.join('\n') + '\n' + src.slice(m.index + m[0].length);
};

const jobs = [];
const panelFrag = read('Jiv/Shaders/Jiv.Panel.frag');
const panelVert = read('Jiv/Shaders/Jiv.Panel.vert');
const variants = {
  glass: { MATERIAL_GLASS: 1 },
  none: { MATERIAL_NONE: 1 },
  flat: { MATERIAL_FLAT: 1 },
  borderless: { MATERIAL_FLAT: 1, NO_SHAPE_GRADIENT: 1 },
  twostop: { MATERIAL_FLAT: 1, NO_SHAPE_GRADIENT: 1, TWO_STOP_GRADIENT: 1 },
  nolight: { MATERIAL_GLASS: 1, GLASS_NO_GLOW: 1, GLASS_NO_SPEC: 1 },
};
for (const [name, d] of Object.entries(variants)) jobs.push([`panel-${name}.frag`, inject(panelFrag, d)]);
jobs.push(['panel.vert', panelVert]);
jobs.push(['rim.vert', read('Jiv/Shaders/Jiv.Rim.vert')]);
jobs.push(['rim.frag', withClip(read('Jiv/Shaders/Jiv.Rim.frag'))]);
jobs.push(['text.frag', withClip(read('Text/Shaders/Text.Quad.frag'))]);

let bad = 0;
for (const [file, src] of jobs) {
  const p = join(OUT, file);
  writeFileSync(p, src);
  try {
    execFileSync(BIN, [p], { stdio: 'pipe' });
    console.log(`ok   ${file}`);
  } catch (e) {
    bad++;
    console.log(`FAIL ${file}\n${(e.stdout ?? '').toString()}${(e.stderr ?? '').toString()}`);
  }
}
process.exit(bad ? 1 : 0);
