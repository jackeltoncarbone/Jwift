// Builds harness specs from the REAL sheets: each surface names a class, flattened by Jaui's own parser with
// Jwift.Glass.jss as the globals tier, and the vars are the sheets' own, so a spec can never drift from source.
import { readFileSync, writeFileSync } from 'node:fs';
import { ParseJss } from 'JAUI/Jss/Jss.Parser';

const ROOT = 'C:/Users/jackc/Code/Repositories/show-studio/';
const J = process.argv[3];
const OUTDIR = process.argv[4];
const norm = (f: string): string => readFileSync(f, 'utf8').split(String.fromCharCode(13)).join('');
const glass = ParseJss(norm(J + 'Glass/Jwift.Glass.jss'));
const SHEETS: Record<string, string> = {
  glass: J + 'Glass/Jwift.Glass.jss',
  tabbar: J + 'TabBar/TabBar.jss',
  selection: J + 'SelectionIndicator/SelectionIndicator.jss',
  button: J + 'GlassButton/GlassButton.jss',
  avatar: J + 'Avatar/Avatar.jss',
};
const parsed: Record<string, ReturnType<typeof ParseJss>> = {};
for (const [k, f] of Object.entries(SHEETS)) parsed[k] = k === 'glass' ? glass : ParseJss(norm(f), glass.Sheet);

// Theme colour tokens the sheets read (Theme.Tokens.ts), in both themes, as flat strings.
const tokensSrc = norm(ROOT + 'ShowStudio.App/src/Ui/Theme.Tokens.ts');
const tokens = (dark: boolean): Record<string, string> => {
  const out: Record<string, string> = {};
  const re = /^\s*([A-Za-z]+):\s*\{[^\n]*?Dark:\s*'([^']+)',\s*Light:\s*'([^']+)'/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tokensSrc)) !== null) out[m[1]] = dark ? m[2] : m[3];
  return out;
};

const varsFor = (dark: boolean): Record<string, string> => {
  const v: Record<string, string> = { ...tokens(dark) };
  for (const p of Object.values(parsed)) Object.assign(v, p.Vars as Record<string, string>);
  v.Dark = dark ? '1' : '0'; v.Light = dark ? '0' : '1';
  return v;
};

const styleOf = (sheet: string, cls: string): Record<string, string> => {
  const c = (parsed[sheet].Sheet as Record<string, { Style?: Record<string, unknown> }>)[cls];
  if (!c) throw new Error(`no class ${cls} in ${sheet}`);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(c.Style ?? {})) if (typeof v === 'string' || typeof v === 'number') out[k] = String(v);
  return out;
};

interface In { name: string; bg: string; dark: boolean; dpr?: number; skip?: number; surfaces: { X: number; Y: number; Width: number; Height: number; Sheet?: string; Class?: string; Style?: Record<string, string>; Edge?: boolean; Flat?: boolean }[] }
const cases: In[] = JSON.parse(readFileSync(process.argv[2], 'utf8'));
for (const c of cases) {
  const surfaces = c.surfaces.map((s) => {
    const base = s.Class ? styleOf(s.Sheet ?? 'glass', s.Class) : {};
    const { Sheet, Class, Style, ...box } = s;
    return { ...box, Style: { ...base, ...(Style ?? {}) } };
  });
  writeFileSync(`${OUTDIR}/${c.name}.json`, JSON.stringify({ bg: c.bg, vars: varsFor(c.dark), surfaces, dpr: c.dpr ?? 3, skip: c.skip ?? 0 }));
}
console.log(cases.map((c) => c.name).join(' '));
