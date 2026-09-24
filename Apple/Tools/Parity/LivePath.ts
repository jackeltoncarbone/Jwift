// LIVE-PATH assertions: the glass properties are WIRED in the real resolve, pack and shader path, not only in the
// harness. Every class the app shows as glass is resolved through Jaui's own parser and resolver from the real
// sheets, packed by the real instance buffer, and the shader and walk sources are checked for the call sites.
import { readFileSync } from 'node:fs';
import { ParseJss } from 'JAUI/Jss/Jss.Parser';
import { ResolveStyle } from 'JAUI/Core/Style.Resolver';
import { DefaultJivStyle } from 'JAUI/Jiv/Jiv.Defaults';
import { JivInstanceBuffer, JIV_FLOATS_PER_INSTANCE } from 'JAUI/Jiv/Jiv.InstanceBuffer';
import { MAT_IDENTITY } from 'JAUI/Transform/Mat2x3';
import { GlassBlurRadius, GlassShadowPeak, GlassSizeRamps, GLASS_TRACKS_LUMA_SPAN } from 'JAUI/Core/Glass.Pipeline';

const ROOT = 'C:/Users/jackc/Code/Repositories/show-studio/';
const J = ROOT + 'ShowStudio.Libraries/Jwift/Jwift.Angular/src/';
const JAUI = ROOT + 'ShowStudio.Libraries/Jaui/Jaui/src/';
const norm = (f: string): string => readFileSync(f, 'utf8').split(String.fromCharCode(13)).join('');
const glass = ParseJss(norm(J + 'Glass/Jwift.Glass.jss'));
const sheets: Record<string, ReturnType<typeof ParseJss>> = {
  glass,
  tabbar: ParseJss(norm(J + 'TabBar/TabBar.jss'), glass.Sheet),
  button: ParseJss(norm(J + 'GlassButton/GlassButton.jss'), glass.Sheet),
  selection: ParseJss(norm(J + 'SelectionIndicator/SelectionIndicator.jss'), glass.Sheet),
};
const vars = (dark: boolean): Map<string, string> => {
  const v = new Map<string, string>();
  for (const p of Object.values(sheets)) for (const [k, x] of Object.entries(p.Vars as Record<string, string>)) v.set(k, x);
  v.set('Dark', dark ? '1' : '0'); v.set('Light', dark ? '0' : '1');
  return v;
};
const out: { Property: string; Apple: string; Ours: string; Metric: string; Pass: boolean }[] = [];
const check = (property: string, apple: string, ours: string, metric: string, pass: boolean): void => {
  out.push({ Property: property, Apple: apple, Ours: ours, Metric: metric, Pass: pass });
};

const resolve = (sheet: string, cls: string, extra: Record<string, string> = {}): any => {
  const c = (sheets[sheet].Sheet as any)[cls];
  if (!c) throw new Error(`no ${cls}`);
  const style: Record<string, string> = { ...(DefaultJivStyle as any) };
  for (const [k, v] of Object.entries(c.Style ?? {})) if (typeof v === 'string' || typeof v === 'number') style[k] = String(v);
  Object.assign(style, extra);
  return ResolveStyle(style as any, { ParentWidth: 400, ParentHeight: 800, PointScale: 1, ParentPointScale: 1, RootPointScale: 1, ViewportWidth: 390, ViewportHeight: 844, Vars: vars(true) } as any);
};

// The app's glass: the base, the tab bar, the glass button, the hero pill (HeroPill : JwiftGlass, in Surface.jss).
const surface = norm(ROOT + 'ShowStudio.App/src/Surface/Surface.jss');
check('live: HeroPill extends JwiftGlass', 'glass', /^HeroPill : JwiftGlass\b/m.test(surface) ? 'glass' : 'not glass', 'rule parents', /^HeroPill : JwiftGlass\b/m.test(surface));
for (const [label, sheet, cls, w, h] of [
  ['JwiftGlass (48 pt button)', 'glass', 'JwiftGlass', 48, 48],
  ['Jwift_TabBar (62 pt bar)', 'tabbar', 'Jwift_TabBar', 360, 62],
  ['Jwift_GlassBtn', 'button', 'Jwift_GlassBtn', 48, 48],
  ['HeroPill optics (JwiftGlass pill)', 'glass', 'JwiftGlass', 138, 48],
] as const) {
  const rs = resolve(sheet, cls);
  const wired = rs.Material === 'LiquidGlass' && rs.Refraction !== 0 && rs.RimStrength > 0 && rs.RimWidth > 0;
  check(`live: ${label} resolves to glass with a rim`, 'LiquidGlass, rim 1 pt', `${rs.Material}, refraction ${rs.Refraction}, rim ${rs.RimWidth} pt x ${rs.RimStrength}`, 'resolved style', wired);
  const b = new JivInstanceBuffer(2);
  b.Push({ X: 10, Y: 10, Width: w, Height: h, RenderStyle: rs, EffectiveOpacity: 1, EffectiveBrightness: 1, EffectiveSaturation: 1, EffectiveContrast: 1 } as any, 3, MAT_IDENTITY, 0, 0, -1, 'Normal', null, 'Excluded');
  const d = b.Data.slice(0, JIV_FLOATS_PER_INSTANCE);
  const packed = d[44] === rs.RimStrength && d[45] === rs.RimWidth && Math.abs(d[37] - Math.min(w, h)) < 1e-6 && d[40] === 3 && d[36] > 0;
  check(`live: ${label} packs rim, span and dpr`, 'lanes 44/45/37/40', `rim ${d[44]} x ${d[45]} pt, span ${d[37]}, dpr ${d[40]}`, 'instance lanes', packed);
}
const frag = norm(JAUI + 'Jiv/Shaders/Jiv.Panel.frag');
const glassBranch = frag.slice(frag.indexOf("// ── APPLE'S GLASS"), frag.indexOf('} else if (hasBackdropFilter)'));
const rimAt = frag.indexOf('#if defined(RIM_ONLY)');
const rimProgram = frag.slice(rimAt, frag.indexOf('#else', rimAt));
const shared = /vec4 rim = GlassRim\(shown, d, normal, key, v_Specular\.x, v_Specular\.y, glassClear, glassLight\)/.test(glassBranch)
  && /vec4 rim = GlassRim\(under, d, normal, GlassKeyLight\(v_Rot, v_Is3D\), v_Specular\.x, height, v_Lighting\.w, v_RimEdge\.x\)/.test(rimProgram);
check('live: fragment and rim pass draw one rim (GlassRim, appearance matrix)', 'one function, backdrop appearance', shared ? 'GlassRim in both' : 'diverged', 'shader source', shared);
const walk = norm(JAUI + 'Core/Jaui.ts');
const decided = /if \(_isGlass\(s\.Material\) && this\._glassFillTakesPyramid\(node\) && !this\._glassRimInPass\(node\)\) return false;/.test(walk)
  && /this\._hasPaintedBorder\(node\) \|\| this\._glassRimInPass\(node\)\)\) \? 'Suppress'/.test(walk)
  && /PanelRimDraw\(flushW, flushH, under, rimSlot\)/.test(walk);
check('live: glass rim takes the pass only where content reaches the band', 'pass over content, fragment otherwise', decided ? '_glassRimInPass: rim pass or face, never both' : 'missing', 'walk source', decided);
const pack = norm(JAUI + 'Jiv/Jiv.InstanceBuffer.ts');
const packs = /data\[offset \+ 44\] = style\.RimStrength;/.test(pack) && /borderMode === 'Suppress'\) \{\s*data\[offset \+ 44\] = 0;/.test(pack);
check('live: a suppressed face leaves the band to the pass', 'lane 44 zero on Suppress', packs ? 'zero on Suppress' : 'missing', 'packer source', packs);
const text = norm(JAUI + 'Text/Shaders/Text.Quad.frag');
check('live: labels on tracking glass follow its appearance', 'white 95% / black', /vec4\(1\.0, 1\.0, 1\.0, 0\.95\)/.test(text) ? 'white 95% / black' : 'missing', 'text shader', /vec4\(1\.0, 1\.0, 1\.0, 0\.95\)/.test(text));
const lv = [Number(vars(true).get('JwiftVibrancyLabel')?.replace(/\s*\*\s*@Dark/, '') ?? NaN), vars(true).get('JwiftVibrancyLabelCover')];
check('labels: Jwift label level', '242 / 0.95 dark, 0 / 1 light', `${vars(true).get('JwiftVibrancyLabel')} / ${lv[1]}`, 'tokens', /242 \* @Dark/.test(vars(true).get('JwiftVibrancyLabel') ?? '') && /0\.95 \* @Dark \+ 1 \* @Light/.test(vars(true).get('JwiftVibrancyLabelCover') ?? ''));
const rest = resolve('glass', 'JwiftGlass');
const press = resolve('selection', 'Jwift_SelectionIndicator_Pressed');
// Replaced 'dispersion: off at rest, on the pressed lens': iOS 26.1's glassBackground carries no aberration uniform
// (QuartzCore default.metallib, glass_background_sdf_lpf), so no glass disperses, the lens included.
check('dispersion: none, at rest or pressed (iOS 26.1 glassBackground has no aberration)', '0', `rest ${rest.ChromaticAberration}, pressed ${press.ChromaticAberration}`, 'resolved style', rest.ChromaticAberration === 0 && press.ChromaticAberration === 0 && press.Material === 'LiquidGlass');
const glassSrc = norm(J + 'Glass/Jwift.Glass.jss');
const pressFill = /JwiftPress:Hover \{\s*BackdropFilter: Vibrancy\(@JwiftVibrancyFill\)/.test(glassSrc) && /JwiftPress:Active \{\s*BackdropFilter: Vibrancy\(@JwiftVibrancyFillPressed\)/.test(glassSrc)
  && /^JwiftPressGlass : JwiftPress \{/m.test(glassSrc) && /JwiftPressMotion:Active \{\s*VisualScale: 0\.92/.test(glassSrc);
check('interaction: a press lifts the glass body and squeezes it', 'lift +30 hover, +50 press', pressFill ? 'JwiftPress fill on JwiftPressGlass' : 'missing', 'sheet rules', pressFill);
const edgeKind = resolve('glass', 'JwiftScrollEdgeTopScene').ProgressiveBlurKind;
const footStyle = /^WidgetFoot \{[\s\S]*?^\}/m.exec(surface)?.[0] ?? '';
const footKind = /ProgressiveBlurKind:\s*ScrollEdge/.test(footStyle) ? 'ScrollEdge' : resolve('glass', 'JwiftGlass', { ProgressiveBlurDirection: 'ToBottom' }).ProgressiveBlurKind;
const edgeGate = /edgeHere = \{/.test(walk) && /ProgressiveBlurKind === 'ScrollEdge'\s*&& node\.RenderStyle\.ProgressiveBlurStops === null/.test(walk);
check('backdrop: glass on a surface blur sees it blurred; in a scroll edge, undimmed', 'post-blur on the card, undimmed under the bar',
  `card foot ${footKind}, scroll edge ${edgeKind}, gate ${edgeGate ? 'on kind' : 'missing'}`, 'resolved kind + walk source',
  footKind === 'Surface' && edgeKind === 'ScrollEdge' && edgeGate);
// The active lens (the pressed selection): its wiring, from the real sheet and sources. Its look is measured on
// our live bar (LiveBar), never over an Apple frame.
const lens = resolve('selection', 'Jwift_SelectionIndicator_Pressed');
const ts = norm(J + 'SelectionIndicator/SelectionIndicator.ts');
const grows = /const baseWidth = t\.Width \+ this\._reachPx \* 2;/.test(ts) && /_TabOutset = '8pt 8pt 8pt 8pt'/.test(ts) && /_SegmentOutset = '12pt 12pt 8pt 8pt'/.test(ts)
  && /this\.SetStyleOverride\(\{ VisualScale: lensScale \}\)/.test(ts);
check('live: the lens is the pill outset by the Apple amount, drawn by VisualScale', '+8 pt a side (tab), +12 / 8 (segmented)', grows ? 'layout stays the pill; VisualScale from the outset' : 'missing', 'component source', grows);
const edgeScope = /closesEdge = true;/.test(walk) && /else if \(closesEdge\) edgeBackdrop = null;/.test(walk);
check('live: glass inside a drawn glass surface samples it, not the scroll edge content', 'the lens sees the bar', edgeScope ? 'a drawn surface closes the edge for its subtree' : 'lens reads the edge', 'walk source', edgeScope);
const tabBar = norm(J + 'TabBar/TabBar.ts');
const letsGo = !/_pressLatchTimer/.test(tabBar) && /this\.selectedChange\.emit\(finalIdx\);\s*this\._dragIndex\.set\(null\);/.test(tabBar);
check('live: the tab bar lets go when the finger lifts', 'lens back in about 90 ms', letsGo ? 'no press latch' : 'latched', 'component source', letsGo);
const config = norm(ROOT + 'ShowStudio.App/src/App.Config.ts');
const noFade = /TAB_TOP = new Set\(StandardTabs\.map/.test(config) && /into !== out && TAB_TOP\.has\(into\) && TAB_TOP\.has\(out\)\)\) transition\.skipTransition\(\)/.test(config);
check('live: a tab switch is not cross-faded (the one canvas would draw the dock twice)', 'the bar switches at once', noFade ? 'view transition skipped between tabs' : 'cross-faded', 'app source', noFade);
// _UILiquidLensView's structure (Jwift/Apple/LiquidGlass.md 7.1): the lens's backdrop is the scene under the bar's
// lifted content, copied before that content draws (SnapshotBelow) and built into the lens's own pyramid; the items
// are lifted inside the lens, never transformed in the bar ([C] no item scale). Replaced 'the item under it lifts on
// its own layer' (Jwift_TabItemLensed): that lift was ours, not Apple's.
const barSheet = norm(J + 'TabBar/TabBar.jss');
const item = norm(J + 'TabBar/TabItem.ts');
const structure = /r\.SnapshotBelow\(/.test(walk) && /r\.ComputeBlur\(below \?\? r\.SceneTexture/.test(walk)
  && !/Lensed/.test(barSheet) && !/Lensed/.test(item);
check("live: the lens is _UILiquidLensView's: its backdrop the scene under the lifted items, the items lifted in the lens", 'backdrop below the items, no item transform',
  `${lens.GlassVariant}, lens ${lens.Lens}${structure ? ', backdrop copied under the items, items untransformed' : ' (structure missing)'}`, 'resolved style + walk and component source',
  lens.GlassVariant === 'Clear' && lens.Lens === 1 && lens.Thickness > 0 && structure);
const u = GlassSizeRamps(104), v = GlassSizeRamps(112);
check('size classes: u over 48-160, v over 64-160, tracking at 56', 'u(104) 0.5, v(112) 0.5, 56 pt',
  `u ${u.U}, v ${v.V}, ${GLASS_TRACKS_LUMA_SPAN} pt`, 'laws', u.U === 0.5 && v.V === 0.5 && GLASS_TRACKS_LUMA_SPAN === 56);
check('blur radius by size and variant', '1.33 at 48, 4 at 160, clear 1', `${GlassBlurRadius(48, 'Regular').toFixed(2)}, ${GlassBlurRadius(160, 'Regular').toFixed(2)}, ${GlassBlurRadius(90, 'Clear')}`, 'laws',
  Math.abs(GlassBlurRadius(48, 'Regular') - 1.3333) < 1e-3 && Math.abs(GlassBlurRadius(160, 'Regular') - 4) < 1e-3 && GlassBlurRadius(90, 'Clear') === 1);
check('shadow opacity by size, none on clear', '0.10 at 48, 0.25 at 160, 0 clear', `${GlassShadowPeak(48, 0).toFixed(3)}, ${GlassShadowPeak(160, 0).toFixed(3)}, ${GlassShadowPeak(160, 1)}`, 'laws',
  Math.abs(GlassShadowPeak(48, 0) - 0.1) < 1e-6 && Math.abs(GlassShadowPeak(160, 0) - 0.25) < 1e-6 && GlassShadowPeak(160, 1) === 0);
console.log(JSON.stringify(out));
