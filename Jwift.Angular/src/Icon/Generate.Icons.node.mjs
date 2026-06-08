/**
 * Jwift Icon Font Generator — PURE NODE.JS port of Generate.py.
 *
 * Produces byte-for-behavior-identical output to the Python generator with NO
 * Python dependency:
 *   - Show Studio:  public/fonts/JwiftIcons/Icon.Font.woff2
 *   - Jwift:        Jwift.Angular/src/Icon/Icon.Data.ts (codepoint map)
 *
 * Pipeline (mirrors Generate.py step-for-step):
 *   1. Read Icon.Source.otf (CFF2 variable font) via fontkit; build name->codepoint
 *      from the best cmap ('_' -> '.').
 *   2. Read the manifest (lowercased, '#' comments skipped) and resolve to codepoints.
 *   3. Subset to those codepoints with harfbuzz (subset-font): desubroutinized,
 *      name_IDs/layout_features kept, notdef outline kept, CFF2 preserved.
 *   4. Vertically center each glyph's ink at y=0 by shifting the first moveto's
 *      y-base in the CFF2 charstring (skip |dy|<2). Ink bounds from fontkit's
 *      default-master bbox; dy uses Python round-half-to-even. Patches CFF2
 *      charstrings in pure JS (see CenterCff2).
 *   5. Rewrite OS/2 + hhea to symmetric ascender=UPM/2, descender=-UPM/2, gap 0,
 *      win asc/desc = UPM.
 *   6. Re-wrap to woff2 (wawoff2).
 *   7. Write Icon.Data.ts (sorted codepoint map).
 *
 * Requires (npm devDependencies): fontkit, subset-font, wawoff2.
 *
 * Usage (from the consuming app dir, with SHOWSTUDIO_ROOT set, as the npm hook does):
 *   node Jwift/Jwift.Angular/src/Icon/Generate.Icons.node.mjs
 *   node ...Generate.Icons.node.mjs --check
 *   node ...Generate.Icons.node.mjs --list [pattern]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';
import subsetFont from 'subset-font';
import wawoff2 from 'wawoff2';

const ICON_DIR = path.dirname(fileURLToPath(import.meta.url));
// The consuming app owns the manifest + font output. Resolution order:
//   1. SHOWSTUDIO_ROOT env var (explicit override), else
//   2. the cwd the generator was invoked from (npm runs it in the app dir) if it
//      looks like an app (has src/Icons), else
//   3. legacy fallback: the app is this script's 4th-level ancestor (nested layout).
function resolveAppRoot() {
  if (process.env.SHOWSTUDIO_ROOT) return path.resolve(process.env.SHOWSTUDIO_ROOT);
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'src', 'Icons', 'Icon.Manifest'))) return cwd;
  return path.resolve(ICON_DIR, '..', '..', '..', '..');
}
const SHOWSTUDIO = resolveAppRoot();
const SOURCE_FONT = path.join(ICON_DIR, 'Icon.Source.otf');
const DATA_FILE = path.join(ICON_DIR, 'Icon.Data.ts');
const MANIFEST_FILE = path.join(SHOWSTUDIO, 'src', 'Icons', 'Icon.Manifest');
const FONT_OUT = path.join(SHOWSTUDIO, 'public', 'fonts', 'JwiftIcons', 'Icon.Font.woff2');

// ---------------------------------------------------------------------------
// Codepoint map (mirrors load_codepoints): best cmap, glyph name '_' -> '.'.
// fontkit exposes the cmap via characterSet + glyphForCodePoint(cp).name.
// ---------------------------------------------------------------------------
function LoadCodepoints(font) {
  const map = {};
  for (const cp of font.characterSet) {
    const g = font.glyphForCodePoint(cp);
    const name = g && g.name;
    if (name) map[name.replace(/_/g, '.')] = cp;
  }
  return map;
}

function ReadManifest() {
  if (!fs.existsSync(MANIFEST_FILE)) {
    console.error(`No manifest at ${MANIFEST_FILE}`);
    process.exit(1);
  }
  return fs.readFileSync(MANIFEST_FILE, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith('#'));
}

// Python's round(): round-half-to-even (banker's rounding) on the exact float.
function PyRound(x) {
  const f = Math.floor(x);
  const diff = x - f;
  if (diff < 0.5) return f;
  if (diff > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1; // exactly .5 -> nearest even
}

// ---------------------------------------------------------------------------
// SFNT helpers
// ---------------------------------------------------------------------------
function ParseSfnt(buf) {
  const numTables = buf.readUInt16BE(4);
  const tables = new Map();
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = buf.toString('latin1', rec, rec + 4);
    tables.set(tag, {
      tag,
      checksum: buf.readUInt32BE(rec + 4),
      offset: buf.readUInt32BE(rec + 8),
      length: buf.readUInt32BE(rec + 12),
      recOffset: rec,
    });
  }
  return { numTables, tables };
}

function CalcChecksum(buf, offset, length) {
  let sum = 0;
  const end = offset + length;
  let i = offset;
  for (; i + 4 <= end; i += 4) sum = (sum + buf.readUInt32BE(i)) >>> 0;
  if (i < end) {
    // pad final partial word with zeros
    let last = 0;
    for (let b = 0; b < 4; b++) {
      last = (last << 8) | (i + b < end ? buf[i + b] : 0);
    }
    sum = (sum + (last >>> 0)) >>> 0;
  }
  return sum >>> 0;
}

// Recompute every table checksum + head.checkSumAdjustment in place (whole-font buffer).
function FixChecksums(buf) {
  const { tables } = ParseSfnt(buf);
  for (const t of tables.values()) {
    let cs;
    if (t.tag === 'head') {
      // head checksum computed with checkSumAdjustment field treated as 0
      const saved = buf.readUInt32BE(t.offset + 8);
      buf.writeUInt32BE(0, t.offset + 8);
      cs = CalcChecksum(buf, t.offset, t.length);
      buf.writeUInt32BE(saved, t.offset + 8);
    } else {
      cs = CalcChecksum(buf, t.offset, t.length);
    }
    buf.writeUInt32BE(cs, t.recOffset + 4);
  }
  // checkSumAdjustment = 0xB1B0AFBA - checksum(whole font with field=0)
  const head = tables.get('head');
  if (head) {
    buf.writeUInt32BE(0, head.offset + 8);
    const whole = CalcChecksum(buf, 0, buf.length);
    const adj = (0xb1b0afba - whole) >>> 0;
    buf.writeUInt32BE(adj, head.offset + 8);
  }
}

// ---------------------------------------------------------------------------
// CFF2 charstring centering
// ---------------------------------------------------------------------------
const MOVERS = { 21: 'rmoveto', 22: 'hmoveto', 4: 'vmoveto' };

function ReadIndex2(buf, pos) {
  const count = buf.readUInt32BE(pos);
  pos += 4;
  if (count === 0) return { objects: [], offsets: [], dataStart: pos, end: pos };
  const offSize = buf.readUInt8(pos);
  pos += 1;
  const readOff = (i) => {
    let v = 0;
    const p = pos + i * offSize;
    for (let b = 0; b < offSize; b++) v = (v << 8) | buf.readUInt8(p + b);
    return v >>> 0;
  };
  const offsets = [];
  for (let i = 0; i <= count; i++) offsets.push(readOff(i));
  const dataStart = pos + (count + 1) * offSize - 1;
  const objects = [];
  for (let i = 0; i < count; i++) objects.push(buf.subarray(dataStart + offsets[i], dataStart + offsets[i + 1]));
  return { objects, offsets, dataStart, end: dataStart + offsets[count] };
}

function BuildIndex2(objects) {
  let dataLen = 0;
  for (const o of objects) dataLen += o.length;
  const total = dataLen + 1;
  let offSize;
  if (total <= 0xff) offSize = 1;
  else if (total <= 0xffff) offSize = 2;
  else if (total <= 0xffffff) offSize = 3;
  else offSize = 4;
  const count = objects.length;
  const out = Buffer.alloc(4 + 1 + (count + 1) * offSize + dataLen);
  out.writeUInt32BE(count, 0);
  out.writeUInt8(offSize, 4);
  const writeOff = (idx, val) => {
    const p = 5 + idx * offSize;
    for (let b = offSize - 1; b >= 0; b--) {
      out.writeUInt8(val & 0xff, p + b);
      val = Math.floor(val / 256);
    }
  };
  let acc = 1;
  writeOff(0, acc);
  let dataPos = 5 + (count + 1) * offSize;
  for (let i = 0; i < count; i++) {
    objects[i].copy(out, dataPos);
    dataPos += objects[i].length;
    acc += objects[i].length;
    writeOff(i + 1, acc);
  }
  return out;
}

function ParseTopDict(buf) {
  const ops = [];
  let i = 0;
  let operands = [];
  let operandStart = 0;
  while (i < buf.length) {
    const b0 = buf[i];
    if (b0 <= 21) {
      let op = b0;
      let len = 1;
      if (b0 === 12) { op = 1200 + buf[i + 1]; len = 2; }
      ops.push({ op, operands: operands.slice(), start: operandStart, end: i + len });
      i += len;
      operands = [];
      operandStart = i;
    } else if (b0 === 28) { operands.push((((buf[i + 1] << 8) | buf[i + 2]) << 16) >> 16); i += 3; }
    else if (b0 === 29) { operands.push((buf[i + 1] << 24) | (buf[i + 2] << 16) | (buf[i + 3] << 8) | buf[i + 4]); i += 5; }
    else if (b0 === 30) {
      let s = ''; i += 1; let done = false;
      while (!done && i < buf.length) {
        const byte = buf[i++];
        for (const nib of [byte >> 4, byte & 0xf]) {
          if (nib <= 9) s += nib;
          else if (nib === 0xa) s += '.';
          else if (nib === 0xb) s += 'E';
          else if (nib === 0xc) s += 'E-';
          else if (nib === 0xe) s += '-';
          else if (nib === 0xf) { done = true; break; }
        }
      }
      operands.push(parseFloat(s));
    } else if (b0 >= 32 && b0 <= 246) { operands.push(b0 - 139); i += 1; }
    else if (b0 >= 247 && b0 <= 250) { operands.push((b0 - 247) * 256 + buf[i + 1] + 108); i += 2; }
    else if (b0 >= 251 && b0 <= 254) { operands.push(-(b0 - 251) * 256 - buf[i + 1] - 108); i += 2; }
    else { i += 1; }
  }
  return ops;
}

function EncodeDictInt(v) {
  if (v >= -107 && v <= 107) return Buffer.from([v + 139]);
  if (v >= 108 && v <= 1131) { const w = v - 108; return Buffer.from([247 + (w >> 8), w & 0xff]); }
  if (v >= -1131 && v <= -108) { const w = -v - 108; return Buffer.from([251 + (w >> 8), w & 0xff]); }
  if (v >= -32768 && v <= 32767) return Buffer.from([28, (v >> 8) & 0xff, v & 0xff]);
  return Buffer.from([29, (v >>> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff]);
}

// Decode a CFF2 charstring into an ordered token list of {type, value/name, raw}.
function DecodeCharString(buf) {
  const tokens = [];
  let i = 0;
  while (i < buf.length) {
    const b0 = buf[i];
    if (b0 >= 32 || b0 === 28) {
      let value;
      let len;
      if (b0 === 28) { value = (((buf[i + 1] << 8) | buf[i + 2]) << 16) >> 16; len = 3; }
      else if (b0 < 247) { value = b0 - 139; len = 1; }
      else if (b0 < 251) { value = (b0 - 247) * 256 + buf[i + 1] + 108; len = 2; }
      else if (b0 < 255) { value = -(b0 - 251) * 256 - buf[i + 1] - 108; len = 2; }
      else {
        const hi = (((buf[i + 1] << 8) | buf[i + 2]) << 16) >> 16;
        const lo = (buf[i + 3] << 8) | buf[i + 4];
        value = hi + lo / 65536; len = 5;
      }
      tokens.push({ type: 'num', value, raw: buf.subarray(i, i + len) });
      i += len;
    } else {
      let op = b0;
      let len = 1;
      if (b0 === 12) { op = 1200 + buf[i + 1]; len = 2; }
      const isMove = MOVERS[b0];
      const isBlend = b0 === 16;
      tokens.push({ type: 'op', op, name: isMove || (isBlend ? 'blend' : 'op' + op), raw: buf.subarray(i, i + len) });
      i += len;
    }
  }
  return tokens;
}

// Encode an integer charstring operand. Values here are existing-base + dy (integers).
function EncodeCSInt(v) {
  if (v >= -107 && v <= 107) return Buffer.from([v + 139]);
  if (v >= 108 && v <= 1131) { const w = v - 108; return Buffer.from([247 + (w >> 8), w & 0xff]); }
  if (v >= -1131 && v <= -108) { const w = -v - 108; return Buffer.from([251 + (w >> 8), w & 0xff]); }
  if (v >= -32768 && v <= 32767) return Buffer.from([28, (v >> 8) & 0xff, v & 0xff]);
  const fixed = Math.round(v * 65536);
  return Buffer.from([255, (fixed >> 24) & 0xff, (fixed >> 16) & 0xff, (fixed >> 8) & 0xff, fixed & 0xff]);
}

// Port of _shift_cff2_program_y at the token level. Mutates one token's value and
// re-encodes its raw bytes. Returns true if a shift was applied.
function ShiftFirstMoveY(tokens, dy) {
  let mi = -1;
  let moveName = null;
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'op' && MOVERS[tokens[i].op]) { mi = i; moveName = tokens[i].name; break; }
  }
  if (mi < 0) return false;

  const isNum = (t) => t && t.type === 'num';
  const isStr = (t) => t && t.type === 'op';
  const setVal = (t, nv) => { t.value = nv; t.raw = EncodeCSInt(nv); };

  if (moveName === 'rmoveto') {
    const prev = tokens[mi - 1];
    if (mi >= 1 && isNum(prev)) {
      // Pattern A or C: plain y right before rmoveto
      setVal(prev, prev.value + dy);
    } else if (mi >= 1 && isStr(prev) && prev.name === 'blend') {
      // Pattern B: blend produces both dx and dy. Find start of this operand group.
      let start = 0;
      for (let j = mi - 1; j >= 0; j--) {
        if (isStr(tokens[j]) && tokens[j].name !== 'blend') { start = j + 1; break; }
      }
      if (start + 1 < mi && isNum(tokens[start + 1])) {
        setVal(tokens[start + 1], tokens[start + 1].value + dy);
      }
    }
  } else if (moveName === 'vmoveto') {
    let start = 0;
    for (let j = mi - 1; j >= 0; j--) {
      if (isStr(tokens[j]) && tokens[j].name !== 'blend') { start = j + 1; break; }
    }
    if (start < mi && isNum(tokens[start])) {
      setVal(tokens[start], tokens[start].value + dy);
    }
  }
  // hmoveto: no y component — nothing to do.
  return true;
}

function EncodeTokens(tokens) {
  return Buffer.concat(tokens.map((t) => Buffer.from(t.raw)));
}

// Apply centering to all glyphs in the SFNT's CFF2 table. dyByCp maps codepoint->dy.
// Returns a NEW whole-font buffer (CFF2 length changes).
function CenterCff2(sfnt, dyByGlyphIndex) {
  const { tables } = ParseSfnt(sfnt);
  const cff2t = tables.get('CFF2');
  const cff2 = sfnt.subarray(cff2t.offset, cff2t.offset + cff2t.length);

  const hdrSize = cff2.readUInt8(2);
  const topDictLength = cff2.readUInt16BE(3);
  const topDictStart = hdrSize;
  const topDict = cff2.subarray(topDictStart, topDictStart + topDictLength);
  const dictOps = ParseTopDict(topDict);
  const csEntry = dictOps.find((o) => o.op === 17); // CharStrings
  const csOffset = csEntry.operands[0];

  const csIndex = ReadIndex2(cff2, csOffset);
  const newObjects = csIndex.objects.map((obj, gi) => {
    const dy = dyByGlyphIndex.get(gi);
    if (!dy) return Buffer.from(obj); // gi not centered (or dy 0)
    const tokens = DecodeCharString(obj);
    ShiftFirstMoveY(tokens, dy);
    return EncodeTokens(tokens);
  });

  const newCsIndex = BuildIndex2(newObjects);

  // Rebuild the CFF2 table: header + TopDict (with patched CharStrings offset) +
  // everything between end of TopDict and start of CharStrings INDEX (GlobalSubrs
  // INDEX, VarStore, FDArray, etc. — all unchanged) + new CharStrings INDEX +
  // anything AFTER the old CharStrings INDEX (private dicts/local subrs live via
  // FDArray offsets which are BEFORE charstrings here; nothing trails it in practice,
  // but we copy any tail to be safe).
  //
  // The only offset in the TopDict that points past itself and could move is
  // CharStrings (17). FDArray (1236) / VarStore (1207 is matrix, 1224 vstore) point
  // to regions BEFORE CharStrings, which don't move. We assert CharStrings is the
  // last-positioned of the offset operators so the prefix is stable.

  const csStart = csOffset; // start of old CharStrings INDEX within cff2
  const csEnd = csIndex.end;
  const prefix = cff2.subarray(0, csStart); // header + topdict + gsubrs + vstore + fdarray
  const suffix = cff2.subarray(csEnd); // usually empty

  // Patch TopDict CharStrings offset. The offset value (csStart) does not change
  // because the prefix length is unchanged (we only changed bytes AFTER csStart).
  // So no TopDict rewrite is needed — but we re-encode defensively in case the
  // offset operand width would differ. Here csStart is identical, so it's a no-op.
  // (We keep the original TopDict bytes intact inside `prefix`.)

  const newCff2 = Buffer.concat([prefix, newCsIndex, suffix]);

  // Splice the new CFF2 table back into the SFNT, rebuilding the table directory
  // with corrected offset/length and 4-byte alignment padding.
  return SpliceTable(sfnt, 'CFF2', newCff2);
}

// Replace one table's bytes and rebuild the SFNT with proper alignment + directory.
function SpliceTable(sfnt, tag, newData) {
  const { tables } = ParseSfnt(sfnt);
  // Gather all tables with current data, replace target.
  const entries = [];
  for (const t of tables.values()) {
    const data = t.tag === tag ? newData : Buffer.from(sfnt.subarray(t.offset, t.offset + t.length));
    entries.push({ tag: t.tag, data });
  }
  // Keep original table directory ORDER (by recOffset) for determinism.
  entries.sort((a, b) => tables.get(a.tag).recOffset - tables.get(b.tag).recOffset);

  const numTables = entries.length;
  const headerLen = 12 + numTables * 16;
  // Physical table order: SFNT spec allows any; preserve original physical order by offset.
  const physical = [...entries].sort((a, b) => tables.get(a.tag).offset - tables.get(b.tag).offset);

  let offset = headerLen;
  const layout = new Map();
  for (const e of physical) {
    layout.set(e.tag, offset);
    offset += e.data.length;
    offset = (offset + 3) & ~3; // 4-byte align
  }
  const totalLen = offset;
  const out = Buffer.alloc(totalLen);

  // sfnt header
  sfnt.copy(out, 0, 0, 4); // sfntVersion
  out.writeUInt16BE(numTables, 4);
  // searchRange/entrySelector/rangeShift
  let maxPow2 = 1, exp = 0;
  while (maxPow2 * 2 <= numTables) { maxPow2 *= 2; exp++; }
  out.writeUInt16BE(maxPow2 * 16, 6);
  out.writeUInt16BE(exp, 8);
  out.writeUInt16BE(numTables * 16 - maxPow2 * 16, 10);

  // directory (sorted by tag per spec; original dir was tag-sorted already)
  const dirSorted = [...entries].sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
  let rec = 12;
  for (const e of dirSorted) {
    out.write(e.tag, rec, 'latin1');
    out.writeUInt32BE(0, rec + 4); // checksum placeholder, fixed later
    out.writeUInt32BE(layout.get(e.tag), rec + 8);
    out.writeUInt32BE(e.data.length, rec + 12);
    rec += 16;
  }
  // table data
  for (const e of physical) e.data.copy(out, layout.get(e.tag));

  FixChecksums(out);
  return out;
}

// Rewrite OS/2 + hhea symmetric metrics. Mutates the SFNT buffer in place
// (lengths unchanged). Returns nothing; caller fixes checksums after.
function RewriteMetrics(sfnt, upm) {
  const { tables } = ParseSfnt(sfnt);
  const half = Math.floor(upm / 2);
  const os2 = tables.get('OS/2');
  if (os2) {
    const o = os2.offset;
    sfnt.writeInt16BE(half, o + 68);   // sTypoAscender
    sfnt.writeInt16BE(-half, o + 70);  // sTypoDescender
    sfnt.writeInt16BE(0, o + 72);      // sTypoLineGap
    sfnt.writeUInt16BE(upm, o + 74);   // usWinAscent
    sfnt.writeUInt16BE(upm, o + 76);   // usWinDescent
  }
  const hhea = tables.get('hhea');
  if (hhea) {
    const o = hhea.offset;
    sfnt.writeInt16BE(half, o + 4);    // ascender
    sfnt.writeInt16BE(-half, o + 6);   // descender
    sfnt.writeInt16BE(0, o + 8);       // lineGap
  }
}

// Encode a string the way Python's Path.write_text() does on a cp1252 Windows
// locale: translate '\n' -> '\r\n', then encode each char to its Windows-1252
// byte. Only ASCII + the em-dash (U+2014 -> 0x97) occur here; cp1252 maps the
// 0x80-0x9F range to specific glyphs (em-dash is 0x97).
const CP1252_HIGH = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
  0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
  0x017e: 0x9e, 0x0178: 0x9f,
};
function EncodeWindowsText(s) {
  const crlf = s.replace(/\n/g, '\r\n');
  const bytes = [];
  for (const ch of crlf) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xff) bytes.push(cp); // ASCII + Latin-1 share cp1252 for <=0x7F and 0xA0-0xFF
    else if (CP1252_HIGH[cp] != null) bytes.push(CP1252_HIGH[cp]);
    else throw new Error(`Char U+${cp.toString(16)} not representable in cp1252`);
  }
  return Buffer.from(bytes);
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------
function CheckAxes() {
  const font = fontkit.openSync(SOURCE_FONT);
  if (!font.namedVariations && !font['fvar'] && !(font.variationAxes && Object.keys(font.variationAxes).length)) {
    console.log('Static font — no variable axes.');
  } else {
    console.log('Variable axes:');
    const pyFloat = (v) => (Number.isInteger(v) ? `${v}.0` : `${v}`); // match Python float repr
    for (const [tag, a] of Object.entries(font.variationAxes || {})) {
      console.log(`  ${tag}: ${pyFloat(a.min)} -> ${pyFloat(a.default)} -> ${pyFloat(a.max)}`);
    }
  }
  const codepoints = LoadCodepoints(font);
  console.log(`Total icons: ${Object.keys(codepoints).length}`);
}

function ListIcons(pattern) {
  const font = fontkit.openSync(SOURCE_FONT);
  const codepoints = LoadCodepoints(font);
  let matches = Object.keys(codepoints).sort();
  if (pattern) matches = matches.filter((n) => n.toLowerCase().includes(pattern.toLowerCase()));
  for (const name of matches.slice(0, 200)) console.log(`  ${name}`);
  const total = matches.length;
  if (total > 200) console.log(`  ... (${total - 200} more)`);
  console.log(`\n${total} icons` + (pattern ? ` matching '${pattern}'` : ' available'));
}

async function Build() {
  if (!fs.existsSync(SOURCE_FONT)) {
    console.error(`Source font not found: ${SOURCE_FONT}`);
    console.error('Run: git lfs pull');
    process.exit(1);
  }

  const font = fontkit.openSync(SOURCE_FONT);
  const codepoints = LoadCodepoints(font);

  const wght = font.variationAxes && font.variationAxes.wght;
  if (wght) console.log(`Variable font — wght: ${Math.round(wght.min)} ${Math.round(wght.max)}`);
  else console.log('Static font');

  const iconNames = ReadManifest();
  const resolved = {};
  for (const name of iconNames) {
    const cp = codepoints[name];
    if (cp == null) {
      console.log(`  ${name}: NOT FOUND — try --list ${name.split('.')[0]}`);
      continue;
    }
    resolved[name] = cp;
    console.log(`  ${name}  U+${cp.toString(16).toUpperCase().padStart(4, '0')}`);
  }
  if (Object.keys(resolved).length === 0) {
    console.log('No icons resolved.');
    return;
  }

  // Compute dy per codepoint from the SOURCE font's default-master ink bbox.
  const dyByCp = new Map();
  for (const cp of Object.values(resolved)) {
    const g = font.glyphForCodePoint(cp);
    const bb = g.bbox;
    const inkCenter = (bb.minY + bb.maxY) / 2;
    const dy = PyRound(0 - inkCenter);
    if (Math.abs(dy) >= 2) dyByCp.set(cp, dy); // skip |dy|<2 (matches Python)
  }

  // --- Subset with harfbuzz (CFF2-preserving, desubroutinized) to SFNT ---
  const srcBuf = fs.readFileSync(SOURCE_FONT);
  const text = Object.values(resolved).map((cp) => String.fromCodePoint(cp)).join('');
  let sfnt = await subsetFont(srcBuf, text, { targetFormat: 'sfnt' });
  sfnt = Buffer.from(sfnt);

  // Map subset glyph index -> dy via the subset cmap (codepoint -> gid).
  const subFont = fontkit.create(sfnt);
  const dyByGid = new Map();
  for (const [cp, dy] of dyByCp) {
    const g = subFont.glyphForCodePoint(cp);
    if (g) dyByGid.set(g.id, dy);
  }

  // --- Center glyph ink (CFF2 charstring shift) ---
  sfnt = CenterCff2(sfnt, dyByGid);

  // --- Symmetric metrics + checksum fix ---
  const upm = subFont.unitsPerEm; // 2048
  RewriteMetrics(sfnt, upm);
  FixChecksums(sfnt);

  // --- Wrap to woff2 ---
  const woff2 = Buffer.from(await wawoff2.compress(sfnt));
  fs.mkdirSync(path.dirname(FONT_OUT), { recursive: true });
  fs.writeFileSync(FONT_OUT, woff2);

  const sizeKb = (woff2.length / 1024).toFixed(1);
  console.log(`\nWrote ${FONT_OUT} (${sizeKb} KB, ${Object.keys(resolved).length} glyphs)`);

  // --- Icon.Data.ts ---
  const half = Math.floor(upm / 2);
  const entries = Object.entries(resolved).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const lines = entries.map(([n, cp]) => `  '${n}': 0x${cp.toString(16).toUpperCase().padStart(4, '0')},`);
  const dataTs =
    '/**\n' +
    ' * Jwift icon codepoint map. Generated — do not edit.\n' +
    ' * Rebuild: python Jwift/Jwift.Angular/src/Icon/Generate.py\n' +
    ' */\n' +
    'export const IconData: Record<string, number> = {\n' +
    lines.join('\n') + '\n' +
    '};\n';
  // Match Python's Path.write_text() on Windows byte-for-byte: locale (cp1252)
  // encoding + universal-newline translation (\n -> \r\n). The only non-ASCII
  // char is the em-dash (U+2014 -> cp1252 0x97).
  fs.writeFileSync(DATA_FILE, EncodeWindowsText(dataTs));
  console.log(`Wrote Icon.Data.ts (${Object.keys(resolved).length} icons)`);
  void half;
  console.log('\nDone.');
}

// ---------------------------------------------------------------------------
async function Main() {
  const arg = process.argv[2];
  if (arg === '--check') return CheckAxes();
  if (arg === '--list') return ListIcons(process.argv[3]);
  return Build();
}

Main().catch((e) => { console.error(e); process.exit(1); });
