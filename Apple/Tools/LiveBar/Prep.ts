// Parses the REAL Jwift sheets the live tab bar is built from, with Jaui's own parser, and writes the rulesets,
// the var tables (both themes, from the app's own theme tokens) and the tab glyphs for the harness page.
import { readFileSync, writeFileSync } from 'node:fs';
import { ParseJss } from 'JAUI/Jss/Jss.Parser';
import { IconData } from 'JWIFT/Icon/Icon.Data';

const ROOT = 'C:/Users/jackc/Code/Repositories/show-studio/';
const J = ROOT + 'ShowStudio.Libraries/Jwift/Jwift.Angular/src/';
const norm = (f: string): string => readFileSync(f, 'utf8').split(String.fromCharCode(13)).join('');
const glass = ParseJss(norm(J + 'Glass/Jwift.Glass.jss'));
const sheets = [glass, ParseJss(norm(J + 'TabBar/TabBar.jss'), glass.Sheet), ParseJss(norm(J + 'SelectionIndicator/SelectionIndicator.jss'), glass.Sheet)];
const tokensSrc = norm(ROOT + 'ShowStudio.App/src/Ui/Theme.Tokens.ts');
const tokens = (dark: boolean): Record<string, string> => {
  const out: Record<string, string> = {};
  const re = /^\s*([A-Za-z]+):\s*\{[^\n]*?Dark:\s*'([^']+)',\s*Light:\s*'([^']+)'/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tokensSrc)) !== null) out[m[1]] = dark ? m[2] : m[3];
  return out;
};
const vars = (dark: boolean): Record<string, string> => {
  const v: Record<string, string> = { ...tokens(dark) };
  for (const p of sheets) Object.assign(v, p.Vars as Record<string, string>);
  v.Dark = dark ? '1' : '0'; v.Light = dark ? '0' : '1';
  return v;
};
const CLASSES = ['Jwift_TabBar', 'Jwift_TabBar_Pressed', 'Jwift_TabItem', 'Jwift_TabItemActive', 'Jwift_TabIcon', 'Jwift_TabIconActive',
  'Jwift_TabLabel', 'Jwift_TabLabelActive', 'Jwift_TabLabelSolo', 'Jwift_TabLabelSoloActive', 'Jwift_SelectionIndicator', 'Jwift_SelectionIndicator_Pressed', 'JwiftScrollEdgeBottomScene'];
const rules: Record<string, unknown> = {};
for (const c of CLASSES) {
  const r = sheets.map((s) => (s.Sheet as Record<string, unknown>)[c]).find((x) => x !== undefined);
  if (!r) continue;
  rules[c] = r;
}
const glyphs = ['house.fill', 'storefront.fill', 'book.pages.fill', 'person.fill', 'sparkles'].map((n) => String.fromCodePoint((IconData as Record<string, number>)[n]));
writeFileSync('prep.json', JSON.stringify({ rules, vars: { dark: vars(true), light: vars(false) }, glyphs }));
console.log('prep', Object.keys(rules).length, 'rules');
