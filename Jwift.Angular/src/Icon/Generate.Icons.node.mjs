/**
 * Jwift icon font generator. Builds the app's icon font from OPEN SOURCE glyphs only.
 *
 *   Icon.Names.json   the vocabulary: an SF style name ("house.fill") -> a glyph in a licensed pack
 *   Icon.Manifest     the app's shopping list (src/Icons/Icon.Manifest in the consuming app)
 *
 * Outputs:
 *   - app:   public/fonts/JwiftIcons/Icon.Font.woff2 + NOTICE.txt (the packs' licenses)
 *   - Jwift: Jwift.Angular/src/Icon/Icon.Data.ts (name -> codepoint)
 *
 * Every glyph is read from its pack's SVG, normalized the way <icon> expects (ink scaled so its
 * longer side is one em, ink centered on the baseline, advance = ink width), and written as a
 * variable TrueType font with a wght axis (100-900) made by offsetting the outline. The build
 * refuses a pack that is not in PACKS and verifies the written font: private use codepoints only
 * (U+E000-U+F8FF), and the license notice in its name table.
 *
 *   node Generate.Icons.node.mjs          build from the manifest
 *   node Generate.Icons.node.mjs --list   list the vocabulary (optionally filtered)
 *   node Generate.Icons.node.mjs --check  verify the shipped font without rebuilding
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import wawoff2 from 'wawoff2';

const ICON_DIR = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// The consuming app owns the manifest and the font output: SHOWSTUDIO_ROOT, else the cwd npm ran in.
function ResolveAppRoot() {
  if (process.env.SHOWSTUDIO_ROOT) return path.resolve(process.env.SHOWSTUDIO_ROOT);
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'src', 'Icons', 'Icon.Manifest'))) return cwd;
  throw new Error('Run from the app directory (it has src/Icons/Icon.Manifest) or set SHOWSTUDIO_ROOT.');
}

const NAMES_FILE = path.join(ICON_DIR, 'Icon.Names.json');
const DATA_FILE = path.join(ICON_DIR, 'Icon.Data.ts');
const FAMILY = 'JwiftIcons';
const UPM = 2048;
const HALF = UPM / 2;
const FIRST_CODEPOINT = 0xE000;
const LAST_CODEPOINT = 0xF8FF;
const WEIGHT = { Min: 100, Default: 400, Max: 900 };
// Outline offset per side, in font units, at the axis ends and at the default. Measured against the
// stroke growth of a system symbol font: a bar is ~12% of the em at 400 and ~25% at 900.
const OFFSET = { Min: -64, Default: 16, Max: 150 };
// Largest distance a cubic may drift from its quadratic replacement, in font units.
const CURVE_TOLERANCE = 0.5;

// The only packs a glyph may come from. A pack is added here with its license, never silently.
const PACKS = {
  Framework7: {
    Title: 'Framework7 Icons',
    License: 'MIT',
    Url: 'https://github.com/framework7io/framework7-icons',
    Root: () => path.dirname(require.resolve('framework7-icons/package.json')),
    Svg: (root, glyph) => path.join(root, 'svg', `${glyph}.svg`),
    LicenseFile: (root) => path.join(root, 'LICENSE'),
  },
  MaterialSymbolsRounded: {
    Title: 'Material Symbols Rounded (weight 400)',
    License: 'Apache-2.0',
    Url: 'https://github.com/google/material-design-icons',
    Root: () => path.join(ICON_DIR, 'Source', 'MaterialSymbolsRounded'),
    Svg: (root, glyph) => path.join(root, `${glyph}.svg`),
    LicenseFile: (root) => path.join(root, 'LICENSE'),
  },
};

// ---------------------------------------------------------------------------
// Vocabulary and manifest
// ---------------------------------------------------------------------------

function ReadNames() {
  const names = JSON.parse(fs.readFileSync(NAMES_FILE, 'utf8'));
  const entries = Object.entries(names).filter(([key]) => !key.startsWith('$'));
  if (FIRST_CODEPOINT + entries.length - 1 > LAST_CODEPOINT) throw new Error('Icon.Names.json outgrew the private use area.');
  // Codepoints follow the order of Icon.Names.json, so the file is append only.
  return new Map(entries.map(([name, entry], index) => {
    for (const part of [entry, ...(entry.Ring ? [entry.Ring] : [])]) {
      if (!PACKS[part.Pack]) throw new Error(`${name}: pack "${part.Pack}" is not a licensed pack (${Object.keys(PACKS).join(', ')}).`);
    }
    return [name, { ...entry, Codepoint: FIRST_CODEPOINT + index }];
  }));
}

function ReadManifest(appRoot) {
  const file = path.join(appRoot, 'src', 'Icons', 'Icon.Manifest');
  return [...new Set(fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line && !line.startsWith('#')))];
}

// ---------------------------------------------------------------------------
// SVG path -> contours of line, quadratic and cubic segments
// ---------------------------------------------------------------------------

function ReadSvg(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (/<(circle|rect|ellipse|polygon|polyline|line|use|g)\b/.test(text)) {
    throw new Error(`${file}: only <path> elements are supported`);
  }
  const paths = [...text.matchAll(/<path\b([^>]*)>/g)].map((m) => m[1]);
  if (!paths.length) throw new Error(`${file}: no path`);
  const contours = paths.flatMap((attributes) => {
    const d = /\sd="([^"]+)"/.exec(attributes)?.[1];
    if (!d) throw new Error(`${file}: a path has no d`);
    const transform = /\stransform="([^"]*)"/.exec(attributes)?.[1];
    if (!transform) return ParsePath(d);
    const translate = /^\s*translate\(\s*([-+.\deE]+)(?:[\s,]+([-+.\deE]+))?\s*\)\s*$/.exec(transform);
    if (!translate) throw new Error(`${file}: unsupported transform "${transform}"`);
    const tx = Number(translate[1]), ty = Number(translate[2] ?? 0);
    return MapContours(ParsePath(d), (x, y) => [x + tx, y + ty]);
  });
  return { EvenOdd: /fill-rule(="|:\s*)evenodd/.test(text), Contours: contours };
}

const IsCommand = (token) => /^[MmLlHhVvCcSsQqTtZzAa]$/.test(token);

function ParsePath(d) {
  const tokens = d.match(/[MmLlHhVvCcSsQqTtZzAa]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const contours = [];
  let contour = null;
  let x = 0, y = 0, startX = 0, startY = 0;
  let lastCubic = null, lastQuad = null;
  let command = '';
  let i = 0;
  const number = () => {
    const token = tokens[i++];
    if (token === undefined || IsCommand(token)) throw new Error(`path: expected a number near token ${i}`);
    return Number(token);
  };
  const close = () => {
    if (contour && contour.Segments.length) {
      if (x !== startX || y !== startY) contour.Segments.push({ Kind: 'L', To: [startX, startY] });
      contours.push(contour);
    }
    contour = null;
    x = startX; y = startY;
  };
  const ensure = () => { if (!contour) contour = { Start: [x, y], Segments: [] }; };
  while (i < tokens.length) {
    if (IsCommand(tokens[i])) command = tokens[i++];
    else if (!command) throw new Error('path: data before a command');
    const relative = command === command.toLowerCase();
    const ox = relative ? x : 0, oy = relative ? y : 0;
    switch (command.toUpperCase()) {
      case 'M': {
        if (contour) close();
        x = ox + number(); y = oy + number();
        startX = x; startY = y;
        contour = { Start: [x, y], Segments: [] };
        command = relative ? 'l' : 'L';
        lastCubic = lastQuad = null;
        break;
      }
      case 'L': ensure(); x = ox + number(); y = oy + number(); contour.Segments.push({ Kind: 'L', To: [x, y] }); lastCubic = lastQuad = null; break;
      case 'H': ensure(); x = ox + number(); contour.Segments.push({ Kind: 'L', To: [x, y] }); lastCubic = lastQuad = null; break;
      case 'V': ensure(); y = oy + number(); contour.Segments.push({ Kind: 'L', To: [x, y] }); lastCubic = lastQuad = null; break;
      case 'C': {
        ensure();
        const c1 = [ox + number(), oy + number()], c2 = [ox + number(), oy + number()], to = [ox + number(), oy + number()];
        contour.Segments.push({ Kind: 'C', C1: c1, C2: c2, To: to });
        lastCubic = c2; lastQuad = null; [x, y] = to;
        break;
      }
      case 'S': {
        ensure();
        const c1 = lastCubic ? [2 * x - lastCubic[0], 2 * y - lastCubic[1]] : [x, y];
        const c2 = [ox + number(), oy + number()], to = [ox + number(), oy + number()];
        contour.Segments.push({ Kind: 'C', C1: c1, C2: c2, To: to });
        lastCubic = c2; lastQuad = null; [x, y] = to;
        break;
      }
      case 'Q': {
        ensure();
        const c = [ox + number(), oy + number()], to = [ox + number(), oy + number()];
        contour.Segments.push({ Kind: 'Q', C: c, To: to });
        lastQuad = c; lastCubic = null; [x, y] = to;
        break;
      }
      case 'T': {
        ensure();
        const c = lastQuad ? [2 * x - lastQuad[0], 2 * y - lastQuad[1]] : [x, y];
        const to = [ox + number(), oy + number()];
        contour.Segments.push({ Kind: 'Q', C: c, To: to });
        lastQuad = c; lastCubic = null; [x, y] = to;
        break;
      }
      case 'Z': close(); lastCubic = lastQuad = null; break;
      default: throw new Error(`path: unsupported command ${command}`);
    }
  }
  if (contour) close();
  return contours;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

function MapContours(contours, fn) {
  const p = (point) => fn(point[0], point[1]);
  return contours.map((c) => ({
    Start: p(c.Start),
    Segments: c.Segments.map((s) => s.Kind === 'L' ? { Kind: 'L', To: p(s.To) }
      : s.Kind === 'Q' ? { Kind: 'Q', C: p(s.C), To: p(s.To) }
        : { Kind: 'C', C1: p(s.C1), C2: p(s.C2), To: p(s.To) }),
  }));
}

function Sample(contours, steps = 24) {
  const points = [];
  for (const c of contours) {
    let from = c.Start;
    points.push(from);
    for (const s of c.Segments) {
      if (s.Kind !== 'L') {
        for (let k = 1; k < steps; k++) {
          const t = k / steps, u = 1 - t;
          points.push(s.Kind === 'Q'
            ? [u * u * from[0] + 2 * u * t * s.C[0] + t * t * s.To[0], u * u * from[1] + 2 * u * t * s.C[1] + t * t * s.To[1]]
            : [u * u * u * from[0] + 3 * u * u * t * s.C1[0] + 3 * u * t * t * s.C2[0] + t * t * t * s.To[0],
              u * u * u * from[1] + 3 * u * u * t * s.C1[1] + 3 * u * t * t * s.C2[1] + t * t * t * s.To[1]]);
        }
      }
      points.push(s.To);
      from = s.To;
    }
  }
  return points;
}

function Bounds(contours) {
  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  for (const [x, y] of Sample(contours)) {
    xMin = Math.min(xMin, x); yMin = Math.min(yMin, y); xMax = Math.max(xMax, x); yMax = Math.max(yMax, y);
  }
  return { xMin, yMin, xMax, yMax };
}

// Loads one glyph as y-up contours in its own units, applying the entry's rotation.
function LoadGlyph(name, part) {
  const pack = PACKS[part.Pack];
  const file = pack.Svg(pack.Root(), part.Glyph);
  if (!fs.existsSync(file)) throw new Error(`${name}: ${part.Pack} has no glyph "${part.Glyph}" (${file})`);
  const svg = ReadSvg(file);
  let contours = MapContours(svg.Contours, (x, y) => [x, -y]);
  if (part.Rotate) {
    const b = Bounds(contours);
    const cx = (b.xMin + b.xMax) / 2, cy = (b.yMin + b.yMax) / 2;
    const a = (part.Rotate * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
    contours = MapContours(contours, (x, y) => [cx + (x - cx) * cos - (y - cy) * sin, cy + (x - cx) * sin + (y - cy) * cos]);
  }
  return { EvenOdd: svg.EvenOdd, Contours: contours };
}

// A glyph set inside its pack's ring, the way a ".circle" symbol reads.
function Ringed(name, entry) {
  const ring = LoadGlyph(name, entry.Ring);
  const inner = LoadGlyph(name, entry);
  const rb = Bounds(ring.Contours), ib = Bounds(inner.Contours);
  const target = Math.max(rb.xMax - rb.xMin, rb.yMax - rb.yMin) * (entry.Ring.Scale ?? 0.5);
  const s = target / Math.max(ib.xMax - ib.xMin, ib.yMax - ib.yMin);
  const rcx = (rb.xMin + rb.xMax) / 2, rcy = (rb.yMin + rb.yMax) / 2, icx = (ib.xMin + ib.xMax) / 2, icy = (ib.yMin + ib.yMax) / 2;
  const placed = MapContours(inner.Contours, (x, y) => [rcx + (x - icx) * s, rcy + (y - icy) * s]);
  return {
    Parts: [
      { EvenOdd: ring.EvenOdd, Contours: ring.Contours },
      { EvenOdd: inner.EvenOdd, Contours: placed },
    ],
  };
}

// Cubic -> quadratics within CURVE_TOLERANCE (blossom split, midpoint quadratic per piece).
function CubicToQuads(p0, c1, c2, p3) {
  const dx = p3[0] - 3 * c2[0] + 3 * c1[0] - p0[0], dy = p3[1] - 3 * c2[1] + 3 * c1[1] - p0[1];
  const n = Math.min(32, Math.max(1, Math.ceil(Math.cbrt((Math.sqrt(3) / 36) * Math.hypot(dx, dy) / CURVE_TOLERANCE))));
  const blossom = (a, b, c) => {
    const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    const l1 = [lerp(p0, c1, a), lerp(c1, c2, a), lerp(c2, p3, a)];
    const l2 = [lerp(l1[0], l1[1], b), lerp(l1[1], l1[2], b)];
    return lerp(l2[0], l2[1], c);
  };
  const quads = [];
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n;
    const a = blossom(t0, t0, t0), b = blossom(t0, t0, t1), c = blossom(t0, t1, t1), d = blossom(t1, t1, t1);
    quads.push({ C: [(3 * (b[0] + c[0]) - a[0] - d[0]) / 4, (3 * (b[1] + c[1]) - a[1] - d[1]) / 4], To: d });
  }
  return quads;
}

// Contours -> TrueType point lists ({ X, Y, On }), explicit on-curve points between every off-curve.
function ToPoints(contours) {
  return contours.map((c) => {
    const points = [{ X: c.Start[0], Y: c.Start[1], On: true }];
    let from = c.Start;
    for (const s of c.Segments) {
      if (s.Kind === 'L') points.push({ X: s.To[0], Y: s.To[1], On: true });
      else if (s.Kind === 'Q') points.push({ X: s.C[0], Y: s.C[1], On: false }, { X: s.To[0], Y: s.To[1], On: true });
      else for (const q of CubicToQuads(from, s.C1, s.C2, s.To)) points.push({ X: q.C[0], Y: q.C[1], On: false }, { X: q.To[0], Y: q.To[1], On: true });
      from = s.To;
    }
    const last = points[points.length - 1];
    if (points.length > 1 && last.On && Math.abs(last.X - points[0].X) < 1e-6 && Math.abs(last.Y - points[0].Y) < 1e-6) points.pop();
    return points;
  }).filter((points) => points.length >= 3);
}

function SignedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    area += a.X * b.Y - b.X * a.Y;
  }
  return area / 2;
}

function Contains(polygon, x, y) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.Y > y) !== (b.Y > y) && x < ((b.X - a.X) * (y - a.Y)) / (b.Y - a.Y) + a.X) inside = !inside;
  }
  return inside;
}

function Reverse(points) {
  const reversed = [...points].reverse();
  const firstOn = reversed.findIndex((p) => p.On);
  return [...reversed.slice(firstOn), ...reversed.slice(0, firstOn)];
}

// Fonts fill by nonzero winding. An even-odd source is rewound so nesting depth decides: even = ink
// (counterclockwise), odd = hole (clockwise). Without this, a ring drawn even-odd fills as a disc.
function RewindEvenOdd(contours) {
  return contours.map((points, index) => {
    const probe = points.find((p) => p.On) ?? points[0];
    const depth = contours.reduce((n, other, j) => n + (j !== index && Contains(other, probe.X, probe.Y) ? 1 : 0), 0);
    const wantPositive = depth % 2 === 0;
    return (SignedArea(points) > 0) === wantPositive ? points : Reverse(points);
  });
}

function Perimeter(points) {
  return points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + Math.hypot(q.X - p.X, q.Y - p.Y);
  }, 0);
}

// A hole narrower than this is a knocked-out stroke, like the plus in plus.circle.fill or the ring
// around a camera lens, not a counter: it widens with weight the way ink strokes do. Width is the
// white band's mean width, 2A/P, with any ink islands inside it taken out.
const KNOCKOUT_WIDTH = 0.2 * UPM;
function HoleWidth(contours, index) {
  const hole = contours[index];
  let area = -SignedArea(hole), perimeter = Perimeter(hole);
  contours.forEach((other, j) => {
    const probe = other.find((p) => p.On) ?? other[0];
    if (j === index || SignedArea(other) <= 0 || !Contains(hole, probe.X, probe.Y)) return;
    area -= SignedArea(other);
    perimeter += Perimeter(other);
  });
  return (2 * area) / perimeter;
}

// Per contour offset: ink takes the full amount; a knocked-out stroke in a filled symbol widens by
// it; a counter closes by at most a fifth of its width, so small counters stay open at heavy weights.
function ContourOffset(contours, index, amount, knockouts) {
  if (SignedArea(contours[index]) >= 0) return amount;
  const width = HoleWidth(contours, index);
  if (knockouts && width < KNOCKOUT_WIDTH) return -amount;
  return Math.sign(amount) * Math.min(Math.abs(amount), 0.2 * width);
}

// Offsets every point along its corner bisector by `strength` font units per side (negative thins).
// Ink winds counterclockwise, so counters shrink as ink grows; knocked-out strokes widen instead.
// Tangential travel is capped at the shorter adjacent edge so tight corners do not cross over.
function Embolden(contours, amount, knockouts) {
  if (!amount) return contours.map((c) => c.map((p) => ({ ...p })));
  const total = contours.reduce((sum, c) => sum + SignedArea(c), 0);
  const sign = total >= 0 ? 1 : -1;
  return contours.map((c, index) => {
    const strength = ContourOffset(contours, index, amount, knockouts);
    const n = c.length;
    return c.map((p, i) => {
      let prev = null, next = null, lIn = 0, lOut = 0;
      for (let k = 1; k < n && !prev; k++) {
        const q = c[(i - k + n) % n];
        const l = Math.hypot(p.X - q.X, p.Y - q.Y);
        if (l > 1e-9) { prev = q; lIn = l; }
      }
      for (let k = 1; k < n && !next; k++) {
        const q = c[(i + k) % n];
        const l = Math.hypot(q.X - p.X, q.Y - p.Y);
        if (l > 1e-9) { next = q; lOut = l; }
      }
      if (!prev || !next) return { ...p };
      const inX = (p.X - prev.X) / lIn, inY = (p.Y - prev.Y) / lIn;
      const outX = (next.X - p.X) / lOut, outY = (next.Y - p.Y) / lOut;
      const d = 1 + inX * outX + inY * outY;
      if (d <= 0.0625) return { ...p };
      const shiftX = sign * (inY + outY), shiftY = -sign * (inX + outX);
      const q = Math.abs(outX * inY - outY * inX);
      const l = Math.min(lIn, lOut);
      const factor = Math.abs(strength) * q > l * d ? Math.sign(strength) * l / q : strength / d;
      return { X: p.X + shiftX * factor, Y: p.Y + shiftY * factor, On: p.On };
    });
  });
}

function Rounded(contours) {
  return contours.map((c) => c.map((p) => ({ X: Math.round(p.X), Y: Math.round(p.Y), On: p.On })));
}

// True ink bounds of TrueType point contours (quadratic segments sampled, not control points).
function InkBounds(contours) {
  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  const add = (x, y) => { xMin = Math.min(xMin, x); yMin = Math.min(yMin, y); xMax = Math.max(xMax, x); yMax = Math.max(yMax, y); };
  for (const c of contours) {
    c.forEach((p, i) => {
      if (p.On) { add(p.X, p.Y); return; }
      const a = c[(i - 1 + c.length) % c.length], b = c[(i + 1) % c.length];
      for (let k = 1; k < 16; k++) {
        const t = k / 16, u = 1 - t;
        add(u * u * a.X + 2 * u * t * p.X + t * t * b.X, u * u * a.Y + 2 * u * t * p.Y + t * t * b.Y);
      }
    });
  }
  return { xMin, yMin, xMax, yMax };
}

// Offsets the outline for one weight, then scales it about (cx, cy) so its longer ink side is one em
// again: heavier weights thicken strokes without growing the symbol, as a system symbol font does.
function Master(contours, offset, cx, cy, knockouts) {
  const bold = Embolden(contours, offset, knockouts);
  const b = InkBounds(bold);
  const f = UPM / Math.max(b.xMax - b.xMin, b.yMax - b.yMin);
  return bold.map((c) => c.map((p) => ({ X: cx + (p.X - cx) * f, Y: cy + (p.Y - cy) * f, On: p.On })));
}

// Builds one glyph: longer ink side = UPM, ink centered on y=0, lsb 0, advance = ink width, with
// the default outline and the two axis-end masters sharing one point structure.
function BuildGlyph(name, entry) {
  const parts = entry.Ring ? Ringed(name, entry).Parts : [LoadGlyph(name, entry)];
  const b = Bounds(parts.flatMap((p) => p.Contours));
  const s = UPM / Math.max(b.xMax - b.xMin, b.yMax - b.yMin);
  const cy = (b.yMin + b.yMax) / 2;
  let contours = [];
  for (const part of parts) {
    let placed = ToPoints(MapContours(part.Contours, (x, y) => [(x - b.xMin) * s, (y - cy) * s]));
    if (part.EvenOdd) placed = RewindEvenOdd(placed);
    // Ink winds counterclockwise in every part, so the weight offset grows ink and shrinks counters.
    if (placed.reduce((sum, c) => sum + SignedArea(c), 0) < 0) placed = placed.map(Reverse);
    contours.push(...placed);
  }
  // Drop repeated on-curve points (they would round onto each other and carry no direction).
  contours = contours.map((c) => c.filter((p, i) => {
    const q = c[(i - 1 + c.length) % c.length];
    return !(p.On && q.On && Math.round(p.X) === Math.round(q.X) && Math.round(p.Y) === Math.round(q.Y));
  })).filter((c) => c.length >= 3);
  const ink = InkBounds(contours);
  const cx = (ink.xMin + ink.xMax) / 2;
  // Only a filled symbol has knocked-out strokes; an outline symbol's narrow holes are counters.
  const knockouts = /\.fill(\.|$)/.test(name);
  const base = Master(contours, OFFSET.Default, cx, 0, knockouts);
  const fit = InkBounds(base);
  const shift = (master) => Rounded(master.map((c) => c.map((p) => ({ ...p, X: p.X - fit.xMin }))));
  return {
    Name: name,
    Codepoint: entry.Codepoint,
    Advance: Math.round(fit.xMax - fit.xMin),
    Contours: shift(base),
    Min: shift(Master(contours, OFFSET.Min, cx, 0, knockouts)),
    Max: shift(Master(contours, OFFSET.Max, cx, 0, knockouts)),
  };
}

// ---------------------------------------------------------------------------
// TrueType writer (glyf + fvar/gvar variable font)
// ---------------------------------------------------------------------------

class Bytes {
  constructor() { this.Parts = []; this.Length = 0; }
  Push(buffer) { this.Parts.push(buffer); this.Length += buffer.length; return this; }
  U8(v) { const b = Buffer.alloc(1); b.writeUInt8(v); return this.Push(b); }
  I8(v) { const b = Buffer.alloc(1); b.writeInt8(v); return this.Push(b); }
  U16(v) { const b = Buffer.alloc(2); b.writeUInt16BE(v); return this.Push(b); }
  I16(v) { const b = Buffer.alloc(2); b.writeInt16BE(v); return this.Push(b); }
  U32(v) { const b = Buffer.alloc(4); b.writeUInt32BE(v >>> 0); return this.Push(b); }
  I32(v) { const b = Buffer.alloc(4); b.writeInt32BE(v); return this.Push(b); }
  Fixed(v) { return this.I32(Math.round(v * 65536)); }
  Tag(s) { return this.Push(Buffer.from(s, 'latin1')); }
  Pad(n = 4) { while (this.Length % n) this.U8(0); return this; }
  ToBuffer() { return Buffer.concat(this.Parts); }
}

function GlyphBounds(contours) {
  let xMin = 0, yMin = 0, xMax = 0, yMax = 0, first = true;
  for (const c of contours) for (const p of c) {
    if (first) { xMin = xMax = p.X; yMin = yMax = p.Y; first = false; }
    xMin = Math.min(xMin, p.X); yMin = Math.min(yMin, p.Y); xMax = Math.max(xMax, p.X); yMax = Math.max(yMax, p.Y);
  }
  return { xMin, yMin, xMax, yMax };
}

function EncodeGlyph(contours) {
  if (!contours.length) return Buffer.alloc(0);
  const b = GlyphBounds(contours);
  const out = new Bytes();
  out.I16(contours.length).I16(b.xMin).I16(b.yMin).I16(b.xMax).I16(b.yMax);
  let end = -1;
  for (const c of contours) { end += c.length; out.U16(end); }
  out.U16(0);
  const flags = new Bytes(), xs = new Bytes(), ys = new Bytes();
  let px = 0, py = 0;
  for (const c of contours) for (const p of c) {
    let flag = p.On ? 1 : 0;
    const dx = p.X - px, dy = p.Y - py;
    if (dx === 0) flag |= 0x10;
    else if (Math.abs(dx) < 256) { flag |= 0x02 | (dx > 0 ? 0x10 : 0); xs.U8(Math.abs(dx)); }
    else xs.I16(dx);
    if (dy === 0) flag |= 0x20;
    else if (Math.abs(dy) < 256) { flag |= 0x04 | (dy > 0 ? 0x20 : 0); ys.U8(Math.abs(dy)); }
    else ys.I16(dy);
    flags.U8(flag);
    px = p.X; py = p.Y;
  }
  out.Push(flags.ToBuffer()).Push(xs.ToBuffer()).Push(ys.ToBuffer()).Pad(4);
  return out.ToBuffer();
}

function PackDeltas(deltas) {
  const out = new Bytes();
  let i = 0;
  while (i < deltas.length) {
    if (deltas[i] === 0) {
      let n = 0;
      while (i + n < deltas.length && deltas[i + n] === 0 && n < 64) n++;
      out.U8(0x80 | (n - 1));
      i += n;
    } else if (deltas[i] >= -128 && deltas[i] <= 127) {
      let n = 0;
      while (i + n < deltas.length && deltas[i + n] !== 0 && deltas[i + n] >= -128 && deltas[i + n] <= 127 && n < 64) n++;
      out.U8(n - 1);
      for (let k = 0; k < n; k++) out.I8(deltas[i + k]);
      i += n;
    } else {
      let n = 0;
      while (i + n < deltas.length && (deltas[i + n] < -128 || deltas[i + n] > 127) && n < 64) n++;
      out.U8(0x40 | (n - 1));
      for (let k = 0; k < n; k++) out.I16(deltas[i + k]);
      i += n;
    }
  }
  return out.ToBuffer();
}

// Per glyph: two tuples against the shared peaks (-1 at wght 100, +1 at wght 900), all points.
function EncodeGlyphVariations(glyph) {
  if (!glyph.Contours.length) return Buffer.alloc(0);
  const tuples = [glyph.Min, glyph.Max].map((master) => {
    const dx = [], dy = [];
    master.forEach((c, ci) => c.forEach((p, pi) => {
      dx.push(p.X - glyph.Contours[ci][pi].X);
      dy.push(p.Y - glyph.Contours[ci][pi].Y);
    }));
    for (let k = 0; k < 4; k++) { dx.push(0); dy.push(0); }
    return Buffer.concat([PackDeltas(dx), PackDeltas(dy)]);
  });
  const out = new Bytes();
  out.U16(0x8000 | tuples.length).U16(4 + 4 * tuples.length);
  tuples.forEach((t, index) => out.U16(t.length).U16(index));
  out.U8(0);
  for (const t of tuples) out.Push(t);
  return out.Pad(2).ToBuffer();
}

function NameTable(records) {
  const entries = Object.entries(records).map(([id, text]) => ({ Id: Number(id), Data: Buffer.from(text, 'utf16le').swap16() }))
    .sort((a, b) => a.Id - b.Id);
  const out = new Bytes();
  out.U16(0).U16(entries.length).U16(6 + 12 * entries.length);
  let offset = 0;
  for (const e of entries) { out.U16(3).U16(1).U16(0x409).U16(e.Id).U16(e.Data.length).U16(offset); offset += e.Data.length; }
  for (const e of entries) out.Push(e.Data);
  return out.ToBuffer();
}

function CmapTable(glyphs) {
  // Segments of consecutive codepoints mapped to consecutive glyph ids (glyph i+1 <-> glyphs[i]).
  const segments = [];
  glyphs.forEach((g, index) => {
    const id = index + 1;
    const last = segments[segments.length - 1];
    if (last && g.Codepoint === last.End + 1 && id === last.Id + (last.End - last.Start) + 1) last.End = g.Codepoint;
    else segments.push({ Start: g.Codepoint, End: g.Codepoint, Id: id });
  });
  segments.push({ Start: 0xFFFF, End: 0xFFFF, Id: 1, Terminal: true });
  const count = segments.length;
  const searchRange = 2 * 2 ** Math.floor(Math.log2(count));
  const sub = new Bytes();
  sub.U16(4).U16(16 + 8 * count).U16(0).U16(count * 2).U16(searchRange).U16(Math.log2(searchRange / 2)).U16(count * 2 - searchRange);
  for (const s of segments) sub.U16(s.End);
  sub.U16(0);
  for (const s of segments) sub.U16(s.Start);
  for (const s of segments) sub.U16(s.Terminal ? 1 : (s.Id - s.Start + 0x10000) & 0xFFFF);
  for (let k = 0; k < count; k++) sub.U16(0);
  const subtable = sub.ToBuffer();
  const out = new Bytes();
  out.U16(0).U16(2);
  out.U16(0).U16(3).U32(4 + 8 * 2);
  out.U16(3).U16(1).U32(4 + 8 * 2);
  return Buffer.concat([out.ToBuffer(), subtable]);
}

function Checksum(buffer) {
  const padded = Buffer.concat([buffer, Buffer.alloc((4 - (buffer.length % 4)) % 4)]);
  let sum = 0;
  for (let i = 0; i < padded.length; i += 4) sum = (sum + padded.readUInt32BE(i)) >>> 0;
  return sum;
}

function WriteFont(glyphs, notice) {
  const all = [{ Name: '.notdef', Advance: HALF, Contours: [], Min: [], Max: [] }, ...glyphs];
  const encoded = all.map((g) => EncodeGlyph(g.Contours));
  const loca = new Bytes();
  let offset = 0;
  for (const e of encoded) { loca.U32(offset); offset += e.length; }
  loca.U32(offset);
  const glyf = Buffer.concat(encoded);

  const bounds = all.filter((g) => g.Contours.length).map((g) => GlyphBounds(g.Contours));
  const xMin = Math.min(...bounds.map((b) => b.xMin)), yMin = Math.min(...bounds.map((b) => b.yMin));
  const xMax = Math.max(...bounds.map((b) => b.xMax)), yMax = Math.max(...bounds.map((b) => b.yMax));
  const maxPoints = Math.max(...all.map((g) => g.Contours.reduce((n, c) => n + c.length, 0)));
  const maxContours = Math.max(...all.map((g) => g.Contours.length));
  const advanceMax = Math.max(...all.map((g) => g.Advance));
  const lsbs = all.map((g) => (g.Contours.length ? GlyphBounds(g.Contours).xMin : 0));
  const rsbs = all.map((g, i) => (g.Contours.length ? g.Advance - GlyphBounds(g.Contours).xMax : 0));
  const extents = all.map((g, i) => (g.Contours.length ? lsbs[i] + (GlyphBounds(g.Contours).xMax - GlyphBounds(g.Contours).xMin) : 0));

  const head = new Bytes();
  head.Fixed(1).Fixed(1).U32(0).U32(0x5F0F3CF5).U16(0x000B).U16(UPM)
    .U32(0).U32(0).U32(0).U32(0)
    .I16(xMin).I16(yMin).I16(xMax).I16(yMax).U16(0).U16(8).I16(2).I16(1).I16(0);

  const hhea = new Bytes();
  hhea.Fixed(1).I16(HALF).I16(-HALF).I16(0).U16(advanceMax)
    .I16(Math.min(...lsbs)).I16(Math.min(...rsbs)).I16(Math.max(...extents))
    .I16(1).I16(0).I16(0).I16(0).I16(0).I16(0).I16(0).I16(0).U16(all.length);

  const maxp = new Bytes();
  maxp.Fixed(1).U16(all.length).U16(maxPoints).U16(maxContours).U16(0).U16(0).U16(2)
    .U16(0).U16(0).U16(0).U16(0).U16(0).U16(0).U16(0).U16(0);

  const hmtx = new Bytes();
  all.forEach((g, i) => hmtx.U16(g.Advance).I16(lsbs[i]));

  const codepoints = glyphs.map((g) => g.Codepoint);
  const os2 = new Bytes();
  os2.U16(4).I16(Math.round(all.reduce((n, g) => n + g.Advance, 0) / all.length)).U16(WEIGHT.Default).U16(5).U16(0)
    .I16(1331).I16(1229).I16(0).I16(154).I16(1331).I16(1229).I16(0).I16(717).I16(102).I16(512).I16(0)
    .Push(Buffer.alloc(10))
    .U32(0).U32(1 << 28).U32(0).U32(0)
    .Tag('JWFT').U16(0x00C0).U16(Math.min(...codepoints)).U16(Math.max(...codepoints))
    .I16(HALF).I16(-HALF).I16(0).U16(UPM).U16(UPM)
    .U32(1).U32(0).I16(0).I16(0).U16(0).U16(0x20).U16(0);

  const post = new Bytes();
  post.Fixed(3).Fixed(0).I16(-100).I16(50).U32(0).U32(0).U32(0).U32(0).U32(0);

  const fvar = new Bytes();
  fvar.U16(1).U16(0).U16(16).U16(2).U16(1).U16(20).U16(1).U16(8)
    .Tag('wght').Fixed(WEIGHT.Min).Fixed(WEIGHT.Default).Fixed(WEIGHT.Max).U16(0).U16(256)
    .U16(2).U16(0).Fixed(WEIGHT.Default);

  const variations = all.map(EncodeGlyphVariations);
  const gvar = new Bytes();
  const sharedTuplesOffset = 20 + 4 * (all.length + 1);
  const dataOffset = sharedTuplesOffset + 4;
  gvar.U16(1).U16(0).U16(1).U16(2).U32(sharedTuplesOffset).U16(all.length).U16(1).U32(dataOffset);
  let voffset = 0;
  for (const v of variations) { gvar.U32(voffset); voffset += v.length; }
  gvar.U32(voffset);
  gvar.I16(-0x4000).I16(0x4000);
  for (const v of variations) gvar.Push(v);

  const name = NameTable({
    0: notice.Copyright,
    1: FAMILY,
    2: 'Regular',
    3: `${FAMILY}-Regular`,
    4: `${FAMILY} Regular`,
    5: 'Version 2.000',
    6: `${FAMILY}-Regular`,
    13: notice.License,
    14: notice.LicenseUrl,
    256: 'Weight',
  });

  const tables = {
    'OS/2': os2.ToBuffer(), cmap: CmapTable(glyphs), fvar: fvar.ToBuffer(), glyf, gvar: gvar.ToBuffer(),
    head: head.ToBuffer(), hhea: hhea.ToBuffer(), hmtx: hmtx.ToBuffer(), loca: loca.ToBuffer(),
    maxp: maxp.ToBuffer(), name, post: post.ToBuffer(),
  };
  const tags = Object.keys(tables).sort();
  const numTables = tags.length;
  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = 16 * 2 ** entrySelector;
  const header = new Bytes();
  header.U32(0x00010000).U16(numTables).U16(searchRange).U16(entrySelector).U16(numTables * 16 - searchRange);
  let tableOffset = 12 + 16 * numTables;
  const body = new Bytes();
  let headOffset = 0;
  for (const tag of tags) {
    const data = tables[tag];
    header.Tag(tag).U32(Checksum(data)).U32(tableOffset).U32(data.length);
    if (tag === 'head') headOffset = tableOffset;
    body.Push(data).Pad(4);
    tableOffset += data.length + ((4 - (data.length % 4)) % 4);
  }
  const font = Buffer.concat([header.ToBuffer(), body.ToBuffer()]);
  font.writeUInt32BE((0xB1B0AFBA - Checksum(font)) >>> 0, headOffset + 8);
  return font;
}

// ---------------------------------------------------------------------------
// Notice and conformance
// ---------------------------------------------------------------------------

function Notice(usedPacks) {
  const sections = usedPacks.map((key) => {
    const pack = PACKS[key];
    const text = fs.readFileSync(pack.LicenseFile(pack.Root()), 'utf8').trim();
    return `${pack.Title}\n${pack.Url}\nLicense: ${pack.License}\n\n${text}`;
  });
  const packs = usedPacks.map((key) => `${PACKS[key].Title} (${PACKS[key].License})`).join(', ');
  return {
    Copyright: `Glyphs from ${packs}.`,
    License: `Built from open source icon packs: ${packs}. See NOTICE.txt beside this font for each license.`,
    LicenseUrl: usedPacks.map((key) => PACKS[key].Url).join(' '),
    Text: `${FAMILY} is built by Jwift from these open source icon packs. Glyphs are normalized and offset\n`
      + `for weight; their shapes are the packs' own.\n\n${sections.join(`\n\n${'-'.repeat(72)}\n\n`)}\n`,
  };
}

// Fails unless the font maps only private use codepoints and carries the open source notice.
function Verify(fontPath) {
  const font = fontkit.openSync(fontPath);
  const problems = [];
  const mapped = font.characterSet.filter((cp) => font.glyphForCodePoint(cp).id !== 0);
  const outside = mapped.filter((cp) => cp < FIRST_CODEPOINT || cp > LAST_CODEPOINT);
  if (outside.length) problems.push(`maps codepoints outside U+E000-U+F8FF: ${outside.slice(0, 8).map((cp) => `U+${cp.toString(16).toUpperCase()}`).join(' ')}`);
  const license = font.getName('license') ?? '';
  if (!/open source icon packs/.test(license)) problems.push('has no open source license notice in its name table');
  for (const key of Object.keys(PACKS)) {
    if (license.includes(PACKS[key].Title) && !license.includes(PACKS[key].License)) problems.push(`names ${key} without its license`);
  }
  if (problems.length) throw new Error(`${fontPath}: ${problems.join('; ')}`);
  return mapped.length;
}

// ---------------------------------------------------------------------------

function Build() {
  const appRoot = ResolveAppRoot();
  const fontOut = path.join(appRoot, 'public', 'fonts', FAMILY, 'Icon.Font.woff2');
  const noticeOut = path.join(appRoot, 'public', 'fonts', FAMILY, 'NOTICE.txt');
  const names = ReadNames();
  const manifest = ReadManifest(appRoot);
  const unknown = manifest.filter((name) => !names.has(name));
  if (unknown.length) throw new Error(`Icon.Manifest names with no open source glyph in Icon.Names.json: ${unknown.join(', ')}`);

  const glyphs = manifest.map((name) => BuildGlyph(name, names.get(name))).sort((a, b) => a.Codepoint - b.Codepoint);
  const usedPacks = Object.keys(PACKS).filter((key) => manifest.some((name) => {
    const entry = names.get(name);
    return entry.Pack === key || entry.Ring?.Pack === key;
  }));
  const notice = Notice(usedPacks);
  const sfnt = WriteFont(glyphs, notice);

  return wawoff2.compress(sfnt).then((woff2) => {
    fs.mkdirSync(path.dirname(fontOut), { recursive: true });
    fs.writeFileSync(fontOut, Buffer.from(woff2));
    fs.writeFileSync(noticeOut, notice.Text);
    const count = Verify(fontOut);
    const lines = glyphs.map((g) => g.Name).sort().map((n) => `  '${n}': 0x${names.get(n).Codepoint.toString(16).toUpperCase()},`);
    fs.writeFileSync(DATA_FILE, '/** Jwift icon codepoint map. Generated by Generate.Icons.node.mjs; do not edit. */\n'
      + `export const IconData: Record<string, number> = {\n${lines.join('\n')}\n};\n`);
    console.log(`[Generate.Icons] ${count} glyphs from ${usedPacks.join(' + ')} -> ${fontOut} (${(woff2.length / 1024).toFixed(1)} KB)`);
  });
}

function List(filter) {
  for (const [name, entry] of ReadNames()) {
    if (filter && !name.includes(filter)) continue;
    const ring = entry.Ring ? ` in ${entry.Ring.Pack}/${entry.Ring.Glyph}` : '';
    console.log(`${name.padEnd(40)} U+${entry.Codepoint.toString(16).toUpperCase()}  ${entry.Pack}/${entry.Glyph}${ring}`);
  }
}

function Check() {
  const fontOut = path.join(ResolveAppRoot(), 'public', 'fonts', FAMILY, 'Icon.Font.woff2');
  console.log(`[Generate.Icons] ${Verify(fontOut)} glyphs, private use only, open source notice present.`);
}

const mode = process.argv[2];
Promise.resolve()
  .then(() => (mode === '--list' ? List(process.argv[3]) : mode === '--check' ? Check() : Build()))
  .catch((error) => { console.error(`[Generate.Icons] ${error.message}`); process.exit(1); });
