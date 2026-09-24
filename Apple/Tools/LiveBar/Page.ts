// THE LIVE TAB BAR, in the real engine: Jaui's own Canvas and JivRegistry (the worker's path), the real Jwift
// classes (Prep.ts), our glyphs and labels, over a real page backdrop drawn by the same engine. Nothing
// Apple-sourced is ever drawn here. The selection indicator is driven the way SelectionIndicator.ts drives it:
// its layout is the resting pill on the active item, and pressed it takes the pressed class, the lens's
// VisualScale override (sized against the bar) and Layer 11 (above the bar rim).
import { Jaui } from 'JAUI/Core/Jaui';
import { JivRegistry } from 'JAUI/Worker/Jiv.Registry';

type Rules = Record<string, Record<string, unknown>>;
interface Prep { rules: Rules; vars: { dark: Record<string, string>; light: Record<string, string> }; glyphs: string[] }
const q = new URLSearchParams(location.search);
const theme = (q.get('theme') ?? 'dark') as 'dark' | 'light';
const prep: Prep = await (await fetch('prep.json')).json();
for (const [family, url] of [['JwiftIcons', 'Icon.Font.woff2'], ['Inter', 'Inter-latin.woff2']]) {
  const f = new FontFace(family, `url(${url})`, { weight: '100 900' }); await f.load(); document.fonts.add(f);
}
// scene=apple: Apple's own page (the MacStories frames with Apple's items and outline painted out, Backdrop/
// apple_backdrop.png) as OUR page's picture, at Apple's size, with our real bar over it at Apple's position and item
// count. Our engine refracts it; nothing of Apple's is drawn over ours.
const apple = q.get('scene') === 'apple';
// scene=segment: the pricing finder's segmented bar (Surface.jss FinderSeg): two label-only items, 56 pt, 4 pt in.
const segment = q.get('scene') === 'segment';
const W = apple ? 440 : 390, H = apple ? 100 : 240;
const el = document.getElementById('c') as HTMLCanvasElement;
el.style.width = W + 'px'; el.style.height = H + 'px';
const jaui = new Jaui(el);
jaui.SetJssVars(new Map(Object.entries(prep.vars[theme])));
const reg = new JivRegistry(jaui.Root as never, () => {});
let next = 1;
const ops: unknown[] = [];
const flush = (): void => { reg.ApplyOps({ T: 'jiv-ops', Ops: ops.splice(0) } as never); };
const optsOf = (cls: string | null, extra: Record<string, unknown> = {}): Record<string, unknown> => {
  const r = cls ? prep.rules[cls] : {};
  const o: Record<string, unknown> = {};
  for (const k of ['Style', 'Layout', 'ChildLayout', 'TextStyle', 'Springs', 'PredicateStyles', 'Animations']) if (r[k] !== undefined) o[k] = r[k];
  if (cls) o.Classes = [cls];
  for (const [k, v] of Object.entries(extra)) o[k] = typeof v === 'object' && v !== null && !Array.isArray(v) && typeof o[k] === 'object' ? { ...(o[k] as object), ...v } : v;
  return o;
};
const created = new Map<number, Record<string, unknown>>();
const make = (parent: number, cls: string | null, extra: Record<string, unknown> = {}): number => {
  const id = next++;
  const o = optsOf(cls, extra); created.set(id, o);
  ops.push({ K: 'create', Id: id, Opts: o }, { K: 'attach', ChildId: id, ParentId: parent });
  return id;
};
const apply = (id: number, cls: string | null, extra: Record<string, unknown> = {}): void => { ops.push({ K: 'apply', Id: id, Opts: optsOf(cls, extra) }); };

// The page: the library's own shape, an art card and its title and byline, black ground.
const dark = theme === 'dark';
const ink = dark ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)';
const screen = make(0, null, { Style: { PointScale: '1', Background: dark ? 'rgba(0, 0, 0, 1)' : 'rgba(242, 242, 247, 1)' },
  Layout: { Direction: 'Column', Justify: 'End', Align: 'Stretch' }, ChildLayout: { Width: W + 'pt', Height: H + 'pt' } });
const page = make(screen, null, { ChildLayout: { Position: 'Placed', Left: '0pt', Top: '0pt', Width: '100%', Height: '100%' }, Layout: { Direction: 'Column', Padding: '40pt 18pt 0pt 18pt', Gap: '6pt' },
  ...(apple ? { Style: { Background: 'Url("apple_backdrop.png", Cover)' } } : {}) });
if (!apple) {
make(page, null, { Style: { Background: 'LinearGradient(90deg, rgba(40, 90, 30, 1) 0%, rgba(120, 170, 60, 1) 40%, rgba(20, 30, 20, 1) 100%)', BorderRadius: '18pt' },
  ChildLayout: { Position: 'Placed', Left: '0pt', Top: '60pt', Width: '120pt', Height: '200pt' } });
// A second cover behind the bar's middle and right, so the lens has colour and edges under it, as Apple's has.
make(page, null, { Style: { Background: 'LinearGradient(120deg, rgba(150, 40, 60, 1) 0%, rgba(230, 150, 60, 1) 45%, rgba(40, 60, 140, 1) 100%)', BorderRadius: '18pt' },
  ChildLayout: { Position: 'Placed', Left: '205pt', Top: '140pt', Width: '175pt', Height: '120pt' } });
make(page, null, { Text: 'Crimson Tide: The Show', TextStyle: { FontFamily: 'Inter', FontSize: '30pt', FontWeight: 700, Color: ink }, ChildLayout: { Height: '38pt' } });
make(page, null, { Text: 'Jack Carbone · Xavier', TextStyle: { FontFamily: 'Inter', FontSize: '28pt', FontWeight: 500, Color: dark ? 'rgba(160, 160, 165, 1)' : 'rgba(90, 90, 95, 1)' }, ChildLayout: { Height: '36pt' } });
make(page, null, { Text: '1,200 pts   Marching band', TextStyle: { FontFamily: 'Inter', FontSize: '22pt', FontWeight: 600, Color: ink }, ChildLayout: { Height: '30pt' } });
}

// The dock: the bottom scroll edge strip, the bar in it, five items and the indicator (the app's Navigation.ts).
// Apple's scene: the bar where Apple's rests (63 to 1045 px across, 56 px down, at 3x) with Apple's four items.
const BAR_W = apple ? '327.3pt' : '355pt';
const edge = apple
  ? make(screen, null, { ChildLayout: { Position: 'Placed', Left: '21pt', Top: '17.3pt', Width: '327.3pt', Height: '62pt' } })
  : make(screen, 'JwiftScrollEdgeBottomScene', { Layout: { Padding: '0pt 12pt 16pt 12pt' } });
// The app's DockBar grows the bar across the phone strip: 355 pt at 390 (the live capture).
const SEG = segment ? { Layout: { Padding: '4pt', Gap: '0pt' }, ChildLayout: { Width: BAR_W, Height: '56pt' } } : { ChildLayout: { Width: BAR_W } };
const bar = make(edge, 'Jwift_TabBar', SEG);
const labels = apple ? ['Home', 'Market', 'Library', 'Profile'] : segment ? ['Just me', 'A school or ensemble'] : ['Home', 'Market', 'Library', 'Profile', 'Explore'];
let selected = apple || segment ? 0 : 2;
const LABEL = segment ? 'Jwift_TabLabelSolo' : 'Jwift_TabLabel';
const accent = 'rgba(255, 193, 7, 1)';
const itemIds: number[] = [], iconIds: number[] = [], labelIds: number[] = [];
const indicator = make(bar, 'Jwift_SelectionIndicator');
labels.forEach((label, i) => {
  const a = i === selected;
  const item = make(bar, a ? 'Jwift_TabItemActive' : 'Jwift_TabItem');
  itemIds.push(item);
  if (!segment) iconIds.push(make(item, a ? 'Jwift_TabIconActive' : 'Jwift_TabIcon', { Text: prep.glyphs[i], TextStyle: { FontFamily: 'JwiftIcons', ...(a ? { Color: accent } : {}) } }));
  labelIds.push(make(item, a ? LABEL + 'Active' : LABEL, { Text: label, TextStyle: a && !segment ? { Color: accent } : {} }));
});
flush();
// Created nodes take their responsive @If rules on the next apply, as the app's first class apply does.
for (const [id, o] of created) ops.push({ K: 'apply', Id: id, Opts: o });
flush();
jaui.Start();

// The indicator, as SelectionIndicator.ts drives it.
// SelectionIndicator.ts: 1.35 item pitches wide, capped at 1.708 bar heights; 1.173 bar heights tall.
// SelectionIndicator.ts: Apple's lens, the pill outset 8 pt a side.
const LENS_OUT_X = segment ? 12 : 8, LENS_OUT_Y = 8;
let pressed = false, dragX: number | null = null, holdAbove = false;
// The bar swells while pressed (Jwift_TabBar_Pressed, additive over Jwift_TabBar), as TabBar.ts does.
const barOpts = (on: boolean): Record<string, unknown> => {
  const o = optsOf('Jwift_TabBar', SEG);
  if (on) { o.Style = { ...(o.Style as object), ...(prep.rules.Jwift_TabBar_Pressed.Style as object) }; o.Springs = { ...(o.Springs as object ?? {}), ...(prep.rules.Jwift_TabBar_Pressed.Springs as object ?? {}) }; o.Classes = ['Jwift_TabBar', 'Jwift_TabBar_Pressed']; }
  return o;
};
const itemOpts = (j: number): Record<string, unknown> => optsOf(j === selected ? 'Jwift_TabItemActive' : 'Jwift_TabItem');
const labelOpts = (j: number): Record<string, unknown> =>
  optsOf(j === selected ? LABEL + 'Active' : LABEL, { TextStyle: j === selected && !segment ? { Color: accent } : {} });
const lift = (...js: number[]): void => { for (const j of js) ops.push({ K: 'apply', Id: itemIds[j], Opts: itemOpts(j) }, { K: 'apply', Id: labelIds[j], Opts: labelOpts(j) }); };
const node = (id: number): { X: number; Y: number; Width: number; Height: number } => reg.Get(id) as never;
const place = (): void => {
  const t = node(itemIds[selected]), b = node(bar);
  if (!t || t.Width <= 0) return;
  const w = t.Width, h = t.Height;
  const cx = dragX ?? t.X + w / 2;
  const style: Record<string, unknown> = {};
  if (pressed) style.VisualScale = `${((w + 2 * LENS_OUT_X) / w).toFixed(4)} ${((h + 2 * LENS_OUT_Y) / h).toFixed(4)}`;
  // SelectionIndicator.ts holds the pill above the labels through the release settle.
  if (pressed || holdAbove) style.Layer = 2;
  // SelectionIndicator.ts: the items under the lens take the bar's accent when it selects in it.
  if (!segment) style.LensInk = accent;
  apply(indicator, pressed ? 'Jwift_SelectionIndicator_Pressed' : 'Jwift_SelectionIndicator',
    { Style: style, ChildLayout: { Position: 'Placed', Left: `${cx - w / 2 - b.X}px`, Top: `${t.Y - b.Y}px`, Width: `${w}px`, Height: `${h}px` } });
  flush();
};
const select = (i: number): void => {
  if (i === selected) return;
  const was = selected;
  for (const [j, a] of [[selected, false], [i, true]] as const) {
    if (!segment) apply(iconIds[j], a ? 'Jwift_TabIconActive' : 'Jwift_TabIcon', { TextStyle: { FontFamily: 'JwiftIcons', ...(a ? { Color: accent } : {}) } });
  }
  selected = i; lift(was, i); flush();
};
const w = window as unknown as Record<string, unknown>;
w.Harness = {
  Press: (): void => { pressed = true; holdAbove = true; ops.push({ K: 'apply', Id: bar, Opts: barOpts(true) }); lift(selected); place(); },
  Drag: (x: number): void => { dragX = x; const hit = itemIds.findIndex((id) => { const n = node(id); return x >= n.X && x < n.X + n.Width; }); if (hit >= 0) select(hit); place(); },
  Hover: (x: number): void => { dragX = x; place(); },
  PressBar: (on: boolean): void => { ops.push({ K: 'apply', Id: bar, Opts: barOpts(on) }); flush(); },
  Release: (): void => { pressed = false; dragX = null; ops.push({ K: 'apply', Id: bar, Opts: barOpts(false) }); lift(selected); place(); setTimeout(() => { holdAbove = false; place(); }, 150); },
  Place: place,
  Rects: (): unknown => {
    const r = (id: number): unknown => { const n = node(id) as never as Record<string, number>; return { X: n.X, Y: n.Y, Width: n.Width, Height: n.Height }; };
    const ind = reg.Get(indicator) as never as { RenderStyle: { VisualScaleX: number; VisualScaleY: number } };
    return { bar: r(bar), items: itemIds.map(r), indicator: r(indicator), scale: [ind.RenderStyle.VisualScaleX, ind.RenderStyle.VisualScaleY] };
  },
};
// First layout, then the resting pill on the active item.
await new Promise((r) => setTimeout(r, 300));
place();
await new Promise((r) => setTimeout(r, 300));
w.__ready = true;
