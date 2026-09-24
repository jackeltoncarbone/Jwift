// Resolve every class that names Vibrancy in the App and Jwift sheets, in both themes, through the engine.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ParseJss } from 'C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/src/Jss/Jss.Parser';
import { ResolveStyle } from 'C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/src/Core/Style.Resolver';
import { DefaultJivStyle } from 'C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/src/Jiv/Jiv.Defaults';
import { FoldVibrancy } from 'C:/Users/jackc/Code/Repositories/show-studio/ShowStudio.Libraries/Jaui/Jaui/src/Core/Vibrancy';

const ROOT = 'C:/Users/jackc/Code/Repositories/show-studio';
const walk = (d: string, out: string[] = []): string[] => {
  for (const n of readdirSync(d)) {
    if (n === 'node_modules' || n === '.claude') continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p, out); else if (n.endsWith('.jss')) out.push(p);
  }
  return out;
};
const files = [...walk(ROOT + '/ShowStudio.Libraries/Jwift/Jwift.Angular/src'), ...walk(ROOT + '/ShowStudio.App/src')];
const vars = new Map<string, string>();
const norm = (f: string): string => readFileSync(f, 'utf8').split(String.fromCharCode(13)).join('');
const glass = ParseJss(norm(ROOT + '/ShowStudio.Libraries/Jwift/Jwift.Angular/src/Glass/Jwift.Glass.jss'));
const sheets = files.flatMap((f) => {
  try { return [ParseJss(norm(f), glass.Sheet)]; }
  catch (e) { console.log('PARSE', f.slice(ROOT.length), (e as Error).message.slice(0, 160)); return []; }
});
for (const s of sheets) for (const [k, v] of Object.entries(s.Vars as Record<string, string>)) vars.set(k, v);
let checked = 0; let failed = 0;
for (const dark of [true, false]) {
  const v = new Map(vars);
  v.set('Dark', dark ? '1' : '0'); v.set('Light', dark ? '0' : '1');
  const ctx = { Vars: v, ParentWidth: 400, ParentHeight: 400, ViewportWidth: 400, ViewportHeight: 800, FontSize: 16, RootFontSize: 16, PointScale: 1 } as never;
  for (const s of sheets) {
    for (const [name, cls] of Object.entries(s.Sheet as Record<string, { Style?: Record<string, unknown> }>)) {
      const st = cls.Style ?? {};
      const keys = ['BackdropFilter', 'Filter', 'TextFilter', 'Vibrancy'].filter((k) => typeof st[k] === 'string' && /Vibrancy/.test(st[k] as string));
      if (keys.length === 0 && typeof st['Vibrancy'] !== 'string') continue;
      try {
        const rs = ResolveStyle({ ...DefaultJivStyle, ...(st as object) } as never, ctx);
        FoldVibrancy(rs.BackdropBrightness, rs.BackdropContrast, { Amount: rs.BackdropVibrancy, Cover: rs.BackdropVibrancyCover });
        checked++;
        if (/Label|Separator|Cover|Tab/.test(name) && (rs.TextVibrancy !== 0 || rs.BackdropVibrancyCover !== 0)) {
          console.log(`${dark ? 'dark ' : 'light'} ${name}: text ${Math.round(rs.TextVibrancy * 255)}/${rs.TextVibrancyCover} backdrop ${Math.round(rs.BackdropVibrancy * 255)}/${rs.BackdropVibrancyCover}`);
        }
      } catch (e) { failed++; console.log('FAIL', name, (e as Error).message.slice(0, 200)); }
    }
  }
}
console.log(`checked ${checked}, failed ${failed}`);
