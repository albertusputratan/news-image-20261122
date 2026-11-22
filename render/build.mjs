import { copyFileSync, existsSync, mkdtempSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const news = JSON.parse(readFileSync(join(root, 'news.json'), 'utf8'));
const land = JSON.parse(readFileSync(join(root, 'render', 'land.json'), 'utf8'));

const INK = '#1B2A4A';
const RED = '#E23C2F';
const MUST = '#F0B429';
const TEAL = '#1F8A70';
const CORAL = '#F26B5B';
const SKY = '#5BA4D0';
const CREAM = '#FBF8F2';
const PAPER = '#F6F0E4';
const WHITE = '#FFFFFF';
const PLAY = 'Playfair Display, "Source Serif Pro", serif';
const SERIF = '"Source Serif Pro", "Liberation Serif", serif';
const SANS = 'Inter, "Liberation Sans", sans-serif';

const REGIONS = ['EUR', 'MEA', 'AFR', 'SAS', 'EAS', 'OCE', 'AME'];
const REGION_NAME = {
  EUR: 'EUROPE', MEA: 'MIDDLE EAST', AFR: 'AFRICA', SAS: 'SOUTH ASIA',
  EAS: 'EAST ASIA', OCE: 'OCEANIA', AME: 'AMERICAS',
};
const REGION_FILL = {
  EUR: INK, MEA: RED, AFR: MUST, SAS: TEAL, EAS: SKY, OCE: CORAL, AME: CREAM,
};
const REGION_INK = {
  EUR: WHITE, MEA: WHITE, AFR: INK, SAS: WHITE, EAS: INK, OCE: INK, AME: INK,
};
const TAG_FILL = {
  CONFIRMED: TEAL, REPORTED: SKY, OFFICIAL: INK, CLAIM: MUST, FORECAST: CORAL,
};
const TAG3 = {
  CONFIRMED: 'CNF', REPORTED: 'REP', OFFICIAL: 'OFF', CLAIM: 'CLM', FORECAST: 'FCT',
};
const PLACE = { 1: 'ANTALYA', 2: 'KYIV REGION', 3: 'WELLINGTON', 4: 'LAS VEGAS' };

const stories = [...news.stories].sort((a, b) => a.id - b.id);
if (stories.length !== 49) throw new Error(`story count ${stories.length}`);
stories.forEach((s, i) => { if (s.id !== i + 1) throw new Error(`id gap ${s.id}`); });
const leads = stories.filter((s) => s.tier === 'lead');
const mids = stories.filter((s) => s.tier === 'mid');
const briefs = stories.filter((s) => s.tier === 'brief');
if (leads.length !== 4 || mids.length !== 10 || briefs.length !== 35) {
  throw new Error('expected 4 leads, 10 mids, 35 briefs');
}
for (const s of briefs) {
  if ([...s.line].length > 36) throw new Error(`brief ${s.id} is ${[...s.line].length} chars`);
}
const jokeIds = new Set([2, 5, 7, 9, 12, 13, 15, 25, 28, 30, 32, 34, 35, 43, 48]);
const scoops = stories.filter((s) => s.scoop);
if (scoops.length > 6) throw new Error(`scoop bubbles ${scoops.length}`);
for (const s of scoops) {
  if (jokeIds.has(s.id)) throw new Error(`scoop on a straight story ${s.id}`);
}

const counts = Object.fromEntries(REGIONS.map((r) => [r, 0]));
for (const s of stories) counts[s.region] += 1;
if (REGIONS.some((r) => !counts[r])) throw new Error('missing region');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function el(tag, attrs, inner) {
  const body = Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
  return inner == null ? `<${tag} ${body}/>` : `<${tag} ${body}>${inner}</${tag}>`;
}
function n(v) { return Math.round(v * 100) / 100; }
function baseline(top, fs, lh, i = 0) {
  const box = fs * lh;
  const half = (box - fs) / 2;
  return top + i * box + half + fs * 0.8;
}
function txt(x, y, str, o) {
  return el('text', {
    x: n(x), y: n(y),
    'font-family': o.family, 'font-size': o.size, 'font-weight': o.weight ?? 400,
    fill: o.fill, 'text-anchor': o.anchor ?? 'start', stroke: 'none',
  }, esc(str));
}
function shape(tag, attrs) {
  return el(tag, {
    stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
    ...attrs,
  });
}
function textWidth(str, fs) {
  let w = 0;
  for (const ch of str) {
    if (ch === ' ') w += 0.33;
    else if ('·.,:;\'-–'.includes(ch)) w += 0.38;
    else if (ch >= '0' && ch <= '9') w += 0.62;
    else if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) w += 0.72;
    else w += 0.56;
  }
  return w * fs;
}

function scoop(cx, cy, s) {
  const r = 8 * s;
  const brim = cy - r * 0.72;
  return [
    shape('path', {
      d: `M${n(cx - r * 1.2)} ${n(brim)} L${n(cx - r * 0.72)} ${n(brim - r * 0.78)} H${n(cx + r * 0.72)} L${n(cx + r * 1.2)} ${n(brim)} Z`,
      fill: CREAM,
    }),
    el('rect', {
      x: n(cx - r * 0.5), y: n(brim - r * 0.62), width: n(r), height: n(r * 0.26),
      fill: RED, stroke: 'none',
    }),
    shape('circle', { cx: n(cx), cy: n(cy), r: n(r), fill: SKY }),
    shape('ellipse', { cx: n(cx), cy: n(cy), rx: n(r * 0.4), ry: n(r), fill: 'none', 'stroke-width': 1.5 }),
    shape('path', { d: `M${n(cx - r)} ${n(cy)} H${n(cx + r)}`, fill: 'none', 'stroke-width': 1.5 }),
    el('circle', { cx: n(cx - r * 0.32), cy: n(cy - r * 0.06), r: n(1.15 * s), fill: INK, stroke: 'none' }),
    el('circle', { cx: n(cx + r * 0.34), cy: n(cy - r * 0.06), r: n(1.15 * s), fill: INK, stroke: 'none' }),
    shape('path', {
      d: `M${n(cx - r * 0.62)} ${n(cy - r * 0.32)} Q${n(cx - r * 0.32)} ${n(cy - r * 0.7)} ${n(cx - r * 0.02)} ${n(cy - r * 0.3)}`,
      fill: 'none',
    }),
    shape('path', { d: `M${n(cx + r * 0.1)} ${n(cy - r * 0.4)} H${n(cx + r * 0.62)}`, fill: 'none' }),
    shape('path', {
      d: `M${n(cx - r * 0.26)} ${n(cy + r * 0.36)} Q${n(cx)} ${n(cy + r * 0.58)} ${n(cx + r * 0.26)} ${n(cy + r * 0.36)}`,
      fill: 'none', 'stroke-width': 1.5,
    }),
  ].join('');
}

function bubble(x, y, w, h, label, fs) {
  return [
    shape('rect', { x: n(x), y: n(y), width: n(w), height: n(h), rx: 2, fill: CREAM }),
    txt(x + w / 2, baseline(y + 1, fs, (h - 2) / fs), label, {
      family: SANS, size: fs, weight: 700, fill: INK, anchor: 'middle',
    }),
  ].join('');
}

function frame(w, h) {
  return shape('rect', { x: 1, y: 1, width: n(w - 2), height: n(h - 2), fill: 'none' });
}

function scene(w, h, dw, dh, bg, body) {
  const s = Math.min(w / dw, h / dh);
  const ox = (w - dw * s) / 2;
  const oy = (h - dh * s) / 2;
  return [
    el('rect', { width: n(w), height: n(h), fill: bg, stroke: 'none' }),
    `<g transform="translate(${n(ox)},${n(oy)}) scale(${n(s)})">${body}</g>`,
    frame(w, h),
  ].join('');
}

function remark(line, x, y, w, h, fs, face) {
  if (!line) return '';
  return scoop(face[0], face[1], face[2]) + bubble(x, y, w, h, line, fs);
}

function artCop(w, h, line) {
  const body = [
    el('rect', { width: 225, height: 96, fill: SKY, stroke: 'none' }),
    el('rect', { y: 96, width: 225, height: 44, fill: MUST, stroke: 'none' }),
    shape('rect', { x: 16, y: 34, width: 193, height: 78, fill: CREAM }),
    el('rect', { x: 72, y: 42, width: 80, height: 16, fill: RED, stroke: 'none' }),
    txt(112, 54, 'COP31', { family: SANS, size: 11, weight: 700, fill: WHITE, anchor: 'middle' }),
    shape('rect', { x: 90, y: 64, width: 44, height: 30, fill: PAPER }),
    shape('path', { d: 'M90 64 H134 M90 64 V112 M134 64 V112 M86 104 H138', fill: 'none' }),
    shape('rect', { x: 86, y: 104, width: 52, height: 8, fill: TEAL }),
    shape('rect', { x: 150, y: 96, width: 10, height: 14, fill: INK }),
    shape('rect', { x: 158, y: 100, width: 30, height: 5, fill: MUST }),
    shape('circle', { cx: 186, cy: 52, r: 11, fill: CREAM }),
    shape('path', { d: 'M186 52 V44 M186 52 L193 56', fill: 'none', 'stroke-width': 1.5 }),
    shape('rect', { x: 28, y: 108, width: 150, height: 10, fill: TEAL }),
    [46, 68, 168].map((cx) => shape('circle', { cx, cy: 112, r: 6, fill: cx === 168 ? CORAL : TEAL })).join(''),
    remark(line, 32, 6, 140, 18, 9, [16, 16, 0.62]),
  ].join('');
  return scene(w, h, 225, 140, SKY, body);
}

function artKyiv(w, h) {
  const wins = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 4; c++) {
      const lit = (r * 3 + c) % 2 === 0;
      wins.push(el('rect', {
        x: 74 + c * 20, y: 36 + r * 15, width: 12, height: 9,
        fill: lit ? MUST : INK, stroke: 'none',
      }));
    }
  }
  const body = [
    el('rect', { width: 225, height: 140, fill: INK, stroke: 'none' }),
    el('polygon', {
      points: '28,126 62,18 46,126', fill: MUST, opacity: 0.45, stroke: 'none',
    }),
    el('polygon', {
      points: '186,126 158,16 204,126', fill: CREAM, opacity: 0.28, stroke: 'none',
    }),
    el('rect', { y: 114, width: 225, height: 26, fill: TEAL, stroke: 'none' }),
    shape('rect', { x: 64, y: 28, width: 98, height: 90, fill: CREAM }),
    el('rect', { x: 58, y: 22, width: 110, height: 8, fill: INK, stroke: INK, 'stroke-width': 2 }),
    wins.join(''),
    drone(22, 16, 1.15), drone(168, 14, 1.25), drone(202, 34, 1),
  ].join('');
  return scene(w, h, 225, 140, INK, body);
}

function drone(x, y, s = 1) {
  return [
    shape('path', { d: `M${n(x - 16 * s)} ${n(y)} H${n(x + 16 * s)}`, stroke: CREAM, fill: 'none' }),
    shape('ellipse', {
      cx: n(x), cy: n(y + 2 * s), rx: n(7 * s), ry: n(3.2 * s), fill: INK, stroke: CREAM, 'stroke-width': 1.5,
    }),
    shape('circle', { cx: n(x - 14 * s), cy: n(y), r: n(4 * s), fill: 'none', stroke: CREAM, 'stroke-width': 1.5 }),
    shape('circle', { cx: n(x + 14 * s), cy: n(y), r: n(4 * s), fill: 'none', stroke: CREAM, 'stroke-width': 1.5 }),
  ].join('');
}

function artPant(w, h) {
  const body = [
    el('rect', { width: 225, height: 88, fill: SKY, stroke: 'none' }),
    el('rect', { y: 88, width: 225, height: 52, fill: TEAL, stroke: 'none' }),
    el('rect', { x: 8, y: 8, width: 74, height: 42, fill: CREAM, stroke: INK, 'stroke-width': 2 }),
    txt(45, 38, '720', { family: PLAY, size: 24, weight: 700, fill: INK, anchor: 'middle' }),
    el('rect', { x: 78, y: 88, width: 50, height: 52, fill: CREAM, stroke: 'none' }),
    shape('path', { d: 'M86 96 V128 M94 96 V128 M102 96 V128 M84 96 H104', fill: 'none' }),
    shape('circle', { cx: 132, cy: 84, r: 9, fill: MUST }),
    shape('path', { d: 'M124 82 H140', fill: 'none', 'stroke-width': 1.5 }),
    shape('path', {
      d: 'M132 93 V118 M120 104 H144 M124 118 L118 134 M140 118 L150 134',
      fill: 'none',
    }),
    shape('path', { d: 'M140 100 L176 48 L184 54 L148 106 Z', fill: MUST }),
    shape('circle', { cx: 196, cy: 36, r: 7, fill: RED }),
    shape('path', { d: 'M0 96 Q40 88 80 96 T160 96 T225 96', fill: 'none', stroke: CREAM, 'stroke-width': 1.5 }),
  ].join('');
  return scene(w, h, 225, 140, SKY, body);
}

function f1(x, y, len, fill) {
  const wr = 10;
  const rear = x + 14;
  const front = x + len - 26;
  return [
    shape('rect', { x: n(x), y: n(y - 30), width: 5, height: 22, fill }),
    shape('rect', { x: n(x), y: n(y - 30), width: 13, height: 3.5, fill }),
    shape('rect', { x: n(x + 1), y: n(y - 22), width: 11, height: 3, fill }),
    shape('path', {
      d: `M${n(x + 12)} ${n(y - 3)} L${n(x + 20)} ${n(y - 13)} L${n(x + 32)} ${n(y - 15)} L${n(x + 40)} ${n(y - 6)} L${n(x + len - 12)} ${n(y - 4)} L${n(x + len - 2)} ${n(y - 1)} L${n(x + 14)} ${n(y - 1)} Z`,
      fill,
    }),
    shape('path', {
      d: `M${n(x + 22)} ${n(y - 13)} L${n(x + 36)} ${n(y - 6)} L${n(x + 26)} ${n(y - 5)} Z`,
      fill: INK,
    }),
    el('circle', { cx: n(x + 29), cy: n(y - 14), r: 5, fill: CREAM, stroke: INK, 'stroke-width': 1.5 }),
    el('path', { d: `M${n(x + 27)} ${n(y - 14)} H${n(x + 33)}`, fill: 'none', stroke: INK, 'stroke-width': 1 }),
    shape('rect', { x: n(x + len - 11), y: n(y - 2), width: 11, height: 4, fill }),
    el('circle', { cx: n(rear), cy: n(y), r: wr, fill: INK, stroke: CREAM, 'stroke-width': 2 }),
    el('circle', { cx: n(front), cy: n(y), r: wr, fill: INK, stroke: CREAM, 'stroke-width': 2 }),
    el('circle', { cx: n(rear), cy: n(y), r: 3.6, fill: CREAM, stroke: 'none' }),
    el('circle', { cx: n(front), cy: n(y), r: 3.6, fill: CREAM, stroke: 'none' }),
  ].join('');
}

function artVegas(w, h, line) {
  const towers = [
    [4, 14, 20, CORAL], [22, 10, 12, MUST], [36, 16, 22, TEAL], [56, 12, 14, SKY],
    [72, 18, 18, CORAL], [94, 12, 16, MUST], [110, 16, 22, TEAL], [130, 10, 12, RED],
    [144, 16, 18, CORAL], [164, 12, 14, MUST], [180, 14, 20, SKY], [198, 12, 12, CORAL],
    [212, 10, 10, MUST],
  ];
  const body = [
    el('rect', { width: 225, height: 140, fill: INK, stroke: 'none' }),
    towers.map(([tx, tw, th, fill]) => el('rect', {
      x: tx, y: 78 - th, width: tw, height: th, fill, stroke: 'none',
    })).join(''),
    el('rect', { y: 100, width: 225, height: 30, fill: PAPER, opacity: 0.14, stroke: 'none' }),
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => el('rect', {
      x: 8 + i * 28, y: 120, width: 12, height: 3, fill: CREAM, stroke: 'none',
    })).join(''),
    [12, 40, 68, 96, 124, 152, 180, 208].map((px) => el('rect', {
      x: px, y: 58, width: 3, height: 18, fill: CREAM, stroke: 'none',
    })).join(''),
    el('rect', { y: 60, width: 225, height: 4, fill: TEAL, stroke: 'none' }),
    el('rect', { y: 66, width: 225, height: 4, fill: CORAL, stroke: 'none' }),
    el('rect', { y: 72, width: 225, height: 4, fill: MUST, stroke: 'none' }),
    f1(7, 112, 64, MUST),
    f1(81, 112, 64, TEAL),
    f1(155, 112, 64, RED),
    el('rect', { y: 130, width: 225, height: 4, fill: TEAL, stroke: 'none' }),
    el('rect', { y: 136, width: 225, height: 4, fill: CORAL, stroke: 'none' }),
    shape('rect', { x: 36, y: 28, width: 154, height: 18, fill: CREAM }),
    txt(113, baseline(28, 11, 18 / 11), '35 lead changes', {
      family: SANS, size: 11, weight: 700, fill: INK, anchor: 'middle',
    }),
    remark(line, 36, 6, 122, 18, 9, [18, 16, 0.58]),
  ].join('');
  return scene(w, h, 225, 140, INK, body);
}

function artBahrain(w, h) {
  const body = [
    el('rect', { width: 180, height: 36, fill: CREAM, stroke: 'none' }),
    el('rect', { y: 36, width: 180, height: 24, fill: TEAL, stroke: 'none' }),
    shape('rect', { x: 22, y: 18, width: 52, height: 26, fill: INK }),
    shape('rect', { x: 30, y: 6, width: 8, height: 14, fill: INK }),
    shape('path', { d: 'M28 10 L34 0 L40 10 Z', fill: RED }),
    shape('path', { d: 'M31 8 L34 2 L37 8 Z', fill: MUST, 'stroke-width': 1 }),
    el('rect', { x: 30, y: 24, width: 8, height: 6, fill: MUST, stroke: 'none' }),
    el('rect', { x: 44, y: 24, width: 8, height: 6, fill: PAPER, stroke: 'none' }),
    el('rect', { x: 58, y: 24, width: 8, height: 6, fill: MUST, stroke: 'none' }),
  ].join('');
  return scene(w, h, 180, 60, CREAM, body);
}

function artHk(w, h) {
  const body = [
    el('rect', { width: 180, height: 60, fill: CREAM, stroke: 'none' }),
    shape('rect', { x: 48, y: 16, width: 46, height: 34, fill: RED }),
    el('rect', { x: 58, y: 10, width: 26, height: 8, fill: CREAM, stroke: INK, 'stroke-width': 2 }),
    shape('rect', { x: 66, y: 2, width: 12, height: 12, fill: PAPER }),
    shape('circle', { cx: 122, cy: 32, r: 12, fill: TEAL }),
    shape('path', { d: 'M116 32 L120 36 L130 26', fill: 'none', stroke: WHITE, 'stroke-width': 2 }),
  ].join('');
  return scene(w, h, 180, 60, CREAM, body);
}

function artMexico(w, h) {
  const body = [
    el('rect', { width: 180, height: 60, fill: MUST, stroke: 'none' }),
    shape('circle', { cx: 42, cy: 30, r: 16, fill: CREAM }),
    shape('path', {
      d: 'M42 16 L46 26 H56 L48 32 L51 42 L42 36 L33 42 L36 32 L28 26 H38 Z',
      fill: RED,
    }),
    shape('circle', { cx: 108, cy: 32, r: 9, fill: 'none' }),
    shape('circle', { cx: 132, cy: 32, r: 9, fill: 'none' }),
    shape('path', { d: 'M117 32 H123', fill: 'none' }),
  ].join('');
  return scene(w, h, 180, 60, MUST, body);
}

function person(x, y, fill) {
  return [
    shape('circle', { cx: n(x), cy: n(y), r: 6, fill }),
    shape('path', {
      d: `M${n(x)} ${n(y + 6)} V${n(y + 20)} M${n(x - 8)} ${n(y + 12)} H${n(x + 8)} M${n(x)} ${n(y + 20)} L${n(x - 6)} ${n(y + 32)} M${n(x)} ${n(y + 20)} L${n(x + 6)} ${n(y + 32)}`,
      fill: 'none',
    }),
  ].join('');
}

function artDelhi(w, h, line) {
  const body = [
    el('rect', { width: 180, height: 60, fill: CREAM, stroke: 'none' }),
    shape('rect', { x: 28, y: 28, width: 14, height: 10, fill: MUST }),
    el('rect', { x: 28, y: 33, width: 14, height: 3, fill: TEAL, stroke: 'none' }),
    shape('rect', { x: 118, y: 28, width: 14, height: 10, fill: RED }),
    person(48, 30, TEAL),
    person(112, 30, CORAL),
    shape('path', { d: 'M56 42 H104', fill: 'none', 'stroke-width': 2 }),
    remark(line, 28, 2, 116, 14, 8, [14, 10, 0.46]),
  ].join('');
  return scene(w, h, 180, 60, CREAM, body);
}

function artEisenkot(w, h) {
  const body = [
    el('rect', { width: 180, height: 60, fill: PAPER, stroke: 'none' }),
    shape('path', { d: 'M8 47 H172', fill: 'none', 'stroke-width': 1.5 }),
    shape('path', { d: 'M14 47 V30 H26 L44 16 L62 30 H76 V47', fill: 'none' }),
    shape('path', { d: 'M34 47 V38 H46 V47', fill: 'none', 'stroke-width': 1.5 }),
    shape('rect', { x: 52, y: 34, width: 12, height: 8, fill: 'none', 'stroke-width': 1.5 }),
    shape('path', {
      d: 'M96 47 L102 41 H112 L118 34 L124 30 L130 35 L136 28 L144 34 H154 L162 40 H170 L174 47 Z',
      fill: INK,
    }),
    shape('rect', { x: 126, y: 36, width: 12, height: 6, fill: PAPER, 'stroke-width': 1 }),
    shape('circle', { cx: 114, cy: 47, r: 6, fill: PAPER }),
    shape('circle', { cx: 156, cy: 47, r: 6, fill: PAPER }),
    shape('path', {
      d: 'M124 29 C122 23 128 21 126 15 M136 27 C140 21 134 19 138 13',
      fill: 'none', 'stroke-width': 1.5,
    }),
  ].join('');
  return scene(w, h, 180, 60, PAPER, body);
}

function artOyo(w, h) {
  const body = [
    el('rect', { width: 180, height: 60, fill: CREAM, stroke: 'none' }),
    shape('ellipse', { cx: 96, cy: 40, rx: 36, ry: 12, fill: TEAL }),
    shape('circle', { cx: 64, cy: 28, r: 7, fill: CORAL }),
    shape('circle', { cx: 96, cy: 22, r: 7, fill: MUST }),
    shape('circle', { cx: 128, cy: 28, r: 7, fill: SKY }),
    shape('path', { d: 'M96 8 C96 8 88 18 88 22 A8 8 0 1 0 104 22 C104 18 96 8 96 8 Z', fill: RED }),
    el('circle', { cx: 96, cy: 22, r: 2.2, fill: CREAM, stroke: 'none' }),
  ].join('');
  return scene(w, h, 180, 60, CREAM, body);
}

function artWemby(w, h, line) {
  const body = [
    el('rect', { width: 180, height: 60, fill: TEAL, stroke: 'none' }),
    el('rect', { y: 40, width: 180, height: 20, fill: MUST, stroke: 'none' }),
    shape('rect', { x: 118, y: 16, width: 8, height: 28, fill: INK }),
    shape('rect', { x: 100, y: 18, width: 26, height: 18, fill: CREAM }),
    txt(113, 32, '50', { family: PLAY, size: 13, weight: 700, fill: RED, anchor: 'middle' }),
    shape('ellipse', { cx: 104, cy: 38, rx: 10, ry: 3, fill: 'none', stroke: RED }),
    shape('path', { d: 'M96 38 V46 M112 38 V46', fill: 'none', 'stroke-width': 1 }),
    shape('circle', { cx: 62, cy: 30, r: 9, fill: CORAL }),
    shape('path', { d: 'M56 30 H68 M62 24 V36', fill: 'none', stroke: INK, 'stroke-width': 1 }),
    remark(line, 22, 2, 92, 14, 8, [12, 10, 0.42]),
  ].join('');
  return scene(w, h, 180, 60, TEAL, body);
}

function artFire(w, h) {
  const body = [
    el('rect', { width: 180, height: 60, fill: INK, stroke: 'none' }),
    el('rect', { y: 44, width: 180, height: 16, fill: TEAL, stroke: 'none' }),
    shape('rect', { x: 18, y: 28, width: 96, height: 20, fill: CREAM }),
    shape('rect', { x: 28, y: 20, width: 10, height: 10, fill: INK }),
    shape('path', { d: 'M36 30 L48 8 L58 28 Z', fill: RED }),
    shape('path', { d: 'M52 32 L66 4 L78 30 Z', fill: MUST }),
    shape('path', { d: 'M74 30 L86 12 L96 30 Z', fill: RED }),
    el('rect', { x: 36, y: 34, width: 8, height: 6, fill: SKY, stroke: 'none' }),
    el('rect', { x: 52, y: 34, width: 8, height: 6, fill: SKY, stroke: 'none' }),
    el('rect', { x: 68, y: 34, width: 8, height: 6, fill: SKY, stroke: 'none' }),
  ].join('');
  return scene(w, h, 180, 60, INK, body);
}

function artGaza(w, h) {
  const body = [
    el('rect', { width: 180, height: 60, fill: CREAM, stroke: 'none' }),
    shape('path', { d: 'M10 48 H170', fill: 'none', 'stroke-width': 1.5 }),
    shape('rect', { x: 16, y: 28, width: 32, height: 20, fill: 'none' }),
    shape('rect', { x: 54, y: 16, width: 36, height: 32, fill: 'none' }),
    shape('rect', { x: 96, y: 22, width: 28, height: 26, fill: 'none' }),
    shape('rect', { x: 130, y: 30, width: 34, height: 18, fill: 'none' }),
    shape('path', {
      d: 'M24 34 H30 M24 40 H30 M36 34 H42 M36 40 H42 M64 24 H72 M64 32 H72 M80 24 H88 M80 32 H88 M104 30 H112 M104 38 H112 M116 30 H120 M138 36 H146 M154 36 H160',
      fill: 'none', 'stroke-width': 1.5,
    }),
  ].join('');
  return scene(w, h, 180, 60, CREAM, body);
}

function artTennis(w, h, line) {
  const body = [
    el('rect', { width: 180, height: 60, fill: TEAL, stroke: 'none' }),
    shape('rect', { x: 8, y: 20, width: 86, height: 32, fill: CREAM }),
    shape('path', { d: 'M51 20 V52 M8 36 H94', fill: 'none', 'stroke-width': 1.5 }),
    shape('rect', { x: 118, y: 22, width: 18, height: 26, fill: MUST }),
    shape('rect', { x: 116, y: 18, width: 22, height: 6, fill: INK }),
    remark(line, 22, 2, 90, 14, 8, [12, 10, 0.42]),
  ].join('');
  return scene(w, h, 180, 60, TEAL, body);
}

const ART = {
  cop31: artCop, kyiv: artKyiv, pant: artPant, vegas: artVegas,
  bahrain: artBahrain, hk: artHk, mexico: artMexico, delhi: artDelhi,
  eisenkot: artEisenkot, oyo: artOyo, wemby: artWemby, fire: artFire,
  gaza: artGaza, tennis: artTennis,
};
for (const s of [...leads, ...mids]) {
  if (!ART[s.art]) throw new Error(`no art for ${s.id}`);
}

function pip(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
const polys = Object.values(land);
function onLand(lon, lat) {
  return polys.some((p) => pip(p, lon, lat));
}
function nearestLand(lon, lat) {
  let best = null;
  for (let y = lat - 10; y <= lat + 10; y += 0.2) {
    for (let x = lon - 10; x <= lon + 10; x += 0.2) {
      const px = Math.round(x * 10) / 10;
      const py = Math.round(y * 10) / 10;
      if (!onLand(px, py)) continue;
      const d = (px - lon) ** 2 + (py - lat) ** 2;
      if (!best || d < best.d) best = { d, x: px, y: py };
    }
  }
  return best && [best.x, best.y];
}
for (const s of stories) {
  if (!s.pin) continue;
  const hit = onLand(s.pin[0], s.pin[1]);
  if (s.water && hit) throw new Error(`sea pin ${s.id} sits on land`);
  if (!s.water && !hit && s.tier !== 'brief') {
    s._snap = nearestLand(s.pin[0], s.pin[1]);
    if (!s._snap) throw new Error(`land pin ${s.id} is off the map shapes`);
  }
}

function segmentWidths(total) {
  const sum = REGIONS.reduce((a, r) => a + counts[r], 0);
  const raw = REGIONS.map((r) => (total * counts[r]) / sum);
  const widths = raw.map((v) => Math.floor(v));
  let left = total - widths.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; k < left; k++) widths[order[k][1]] += 1;
  return widths;
}

function tagInk(tag) {
  return tag === 'OFFICIAL' || tag === 'CONFIRMED' ? WHITE : INK;
}

function chip(x, y, tag) {
  const label = TAG3[tag];
  return [
    shape('rect', { x: n(x), y: n(y), width: 28, height: 13, rx: 1, fill: TAG_FILL[tag], 'stroke-width': 1 }),
    txt(x + 14, baseline(y, 8, 13 / 8), label, {
      family: SANS, size: 8, weight: 700, fill: tagInk(tag), anchor: 'middle',
    }),
  ].join('');
}

function buildSvg() {
  const W = 1024;
  const M = 14;
  const inner = W - M * 2;
  const parts = [];
  parts.push(el('rect', { width: W, height: W, fill: PAPER, stroke: 'none' }));

  let y = M;
  const kickerFs = 13;
  const kickerLh = 1.25;
  const kickerBase = baseline(y, kickerFs, kickerLh);
  parts.push(txt(M, kickerBase, news.masthead, { family: SANS, size: kickerFs, weight: 700, fill: RED }));
  parts.push(txt(M + inner, kickerBase, `${stories.length} STORIES · 7 REGIONS · SUNDAY 22 NOVEMBER 2026`, {
    family: SANS, size: 11, weight: 600, fill: INK, anchor: 'end',
  }));
  y += kickerFs * kickerLh + 2;

  const dateFs = 72;
  const dateLh = 1.1;
  parts.push(txt(M, baseline(y, dateFs, dateLh), news.date, {
    family: PLAY, size: dateFs, weight: 700, fill: INK,
  }));
  y += dateFs * dateLh + 2;

  const standFs = 13;
  const standLh = 1.3;
  parts.push(txt(M, baseline(y, standFs, standLh), news.standfirst, {
    family: SERIF, size: standFs, weight: 400, fill: INK,
  }));
  y += standFs * standLh + 3;

  const scoopH = 24;
  parts.push(shape('rect', { x: M, y: n(y), width: inner, height: scoopH, fill: CREAM, 'stroke-width': 1.5 }));
  parts.push(scoop(M + 16, y + 14, 0.7));
  parts.push(txt(M + 34, baseline(y, 12.5, scoopH / 12.5), `Scoop · ${news.scoopLine}`, {
    family: SERIF, size: 12.5, weight: 400, fill: INK,
  }));
  y += scoopH + 4;

  const regionH = 22;
  const regionFs = 11;
  const widths = segmentWidths(inner);
  let rx = M;
  REGIONS.forEach((r, i) => {
    parts.push(el('rect', {
      x: n(rx), y: n(y), width: widths[i], height: regionH,
      fill: REGION_FILL[r], stroke: INK, 'stroke-width': 1,
    }));
    parts.push(txt(rx + 6, baseline(y, regionFs, regionH / regionFs), `${r} ${counts[r]}`, {
      family: SANS, size: regionFs, weight: 700, fill: REGION_INK[r],
    }));
    rx += widths[i];
  });
  y += regionH + 5;

  const gap = 8;
  const leadW = (inner - gap * 3) / 4;
  const pad = 9;
  const artH = 140;
  const artGap = 10;
  const tagFs = 10;
  const tagLh = 1.25;
  const titleFs = 20;
  const titleLh = 1.18;
  const deckFs = 11.5;
  const deckLh = 1.35;
  const srcFs = 9;
  const srcLh = 1.3;
  const leadH = pad + artH + artGap + tagFs * tagLh + 2 + titleFs * titleLh * 2 + 3 + deckFs * deckLh * 2 + 2 + srcFs * srcLh + pad;

  leads.forEach((s, i) => {
    const x = M + i * (leadW + gap);
    parts.push(shape('rect', { x: n(x), y: n(y), width: n(leadW), height: n(leadH), fill: CREAM, 'stroke-width': 1.5 }));
    const aw = leadW - pad * 2;
    parts.push(`<g transform="translate(${n(x + pad)},${n(y + pad)})">${ART[s.art](aw, artH, s.scoop)}</g>`);
    let ty = y + pad + artH + artGap;
    parts.push(txt(x + pad, baseline(ty, tagFs, tagLh), `${s.region} · ${PLACE[s.id]}`, {
      family: SANS, size: tagFs, weight: 700, fill: INK,
    }));
    parts.push(txt(x + leadW - pad, baseline(ty, tagFs, tagLh), s.tag, {
      family: SANS, size: tagFs, weight: 700, fill: TAG_FILL[s.tag], anchor: 'end',
    }));
    ty += tagFs * tagLh + 2;
    s.title.forEach((line, li) => {
      parts.push(txt(x + pad, baseline(ty, titleFs, titleLh, li), line, {
        family: PLAY, size: titleFs, weight: 700, fill: INK,
      }));
    });
    ty += titleFs * titleLh * 2 + 3;
    s.deck.forEach((line, li) => {
      parts.push(txt(x + pad, baseline(ty, deckFs, deckLh, li), line, {
        family: SERIF, size: deckFs, weight: 400, fill: INK,
      }));
    });
    ty += deckFs * deckLh * 2 + 2;
    parts.push(txt(x + pad, baseline(ty, srcFs, srcLh), s.source, {
      family: SANS, size: srcFs, weight: 500, fill: INK,
    }));
  });
  y += leadH + 6;

  const midW = (inner - gap * 4) / 5;
  const midPad = 7;
  const midArt = 60;
  const midArtGap = 8;
  const midTitleFs = 12.5;
  const midTitleLh = 1.2;
  const midDeckFs = 10;
  const midDeckLh = 1.3;
  const midH = midPad + midArt + midArtGap + midTitleFs * midTitleLh * 2 + 3 + midDeckFs * midDeckLh + midPad;

  mids.forEach((s, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = M + col * (midW + gap);
    const cy = y + row * (midH + 6);
    parts.push(shape('rect', { x: n(x), y: n(cy), width: n(midW), height: n(midH), fill: CREAM, 'stroke-width': 1.5 }));
    const aw = midW - midPad * 2;
    parts.push(`<g transform="translate(${n(x + midPad)},${n(cy + midPad)})">${ART[s.art](aw, midArt, s.scoop)}</g>`);
    parts.push(chip(x + midW - midPad - 31, cy + midPad + 3, s.tag));
    let ty = cy + midPad + midArt + midArtGap;
    s.title.forEach((line, li) => {
      parts.push(txt(x + midPad, baseline(ty, midTitleFs, midTitleLh, li), line, {
        family: PLAY, size: midTitleFs, weight: 700, fill: INK,
      }));
    });
    ty += midTitleFs * midTitleLh * 2 + 3;
    parts.push(txt(x + midPad, baseline(ty, midDeckFs, midDeckLh), s.deck[0], {
      family: SERIF, size: midDeckFs, weight: 400, fill: INK,
    }));
  });
  y += midH * 2 + 6 + 5;

  const footFs = 8.5;
  const footLh = 1.3;
  const footH = footFs * footLh;
  const dateLines = news.dateCheck;
  const dateFs2 = 10;
  const dateLh2 = 1.3;
  const datePad = 4;
  const dateH = datePad + dateFs2 * dateLh2 * dateLines.length + datePad;
  const bottom = W - M;
  const footerTop = bottom - footH;
  const dateTop = footerTop - 3 - dateH;
  const bandTop = y;
  const bandH = dateTop - 4 - bandTop;
  if (bandH < 190) throw new Error(`band too short ${bandH}`);

  const mapW = 330;
  const mapped = [...leads, ...mids].map((s) => ({ ...s, pin: s._snap || s.pin }));
  parts.push(drawMap(M, bandTop, mapW, bandH, mapped));

  const briefsX = M + mapW + 8;
  const briefsW = inner - mapW - 8;
  const colGap = 8;
  const colW = (briefsW - colGap * 2) / 3;
  const groups = [['EUR'], ['MEA', 'AFR', 'SAS'], ['EAS', 'OCE', 'AME']];
  const bFs = 9.5;
  const bLh = 1.35;
  const lineH = bFs * bLh;
  groups.forEach((regs, ci) => {
    const x = briefsX + ci * (colW + colGap);
    const tagW = textWidth('CNF', bFs);
    const titleMax = colW - tagW - 8;
    let by = bandTop;
    let first = true;
    for (const r of regs) {
      if (!first) by += 3;
      first = false;
      parts.push(txt(x, baseline(by, bFs, bLh), REGION_NAME[r], {
        family: SANS, size: bFs, weight: 700, fill: INK,
      }));
      by += lineH;
      for (const s of briefs.filter((b) => b.region === r)) {
        let line = s.line;
        while (line.length > 1 && textWidth(line, bFs) > titleMax) line = line.slice(0, -1);
        line = line.trimEnd();
        parts.push(txt(x, baseline(by, bFs, bLh), line, {
          family: SANS, size: bFs, weight: 500, fill: INK,
        }));
        parts.push(txt(x + colW, baseline(by, bFs, bLh), TAG3[s.tag], {
          family: SANS, size: bFs, weight: 700, fill: TAG_FILL[s.tag], anchor: 'end',
        }));
        by += lineH;
      }
    }
    if (by > bandTop + bandH + 1) throw new Error(`briefs column ${ci} overflow ${n(by)} > ${n(bandTop + bandH)}`);
  });

  parts.push(el('rect', { x: M, y: n(dateTop), width: inner, height: n(dateH), fill: RED, stroke: 'none' }));
  dateLines.forEach((line, i) => {
    parts.push(txt(M + 8, baseline(dateTop + datePad, dateFs2, dateLh2, i), line, {
      family: SANS, size: dateFs2, weight: 700, fill: WHITE,
    }));
  });
  parts.push(txt(M, baseline(footerTop, footFs, footLh), news.footer, {
    family: SANS, size: footFs, weight: 500, fill: INK,
  }));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
${parts.join('\n')}
</svg>`;
}

function drawMap(x, y, w, h, items) {
  const pad = 6;
  const ix = x + pad;
  const iy = y + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const lon0 = -180;
  const lon1 = 180;
  let lat0 = 90;
  let lat1 = -90;
  for (const poly of polys) {
    for (const p of poly) {
      if (p[1] < lat0) lat0 = p[1];
      if (p[1] > lat1) lat1 = p[1];
    }
  }
  for (const s of items) {
    if (s.pin[1] < lat0) lat0 = s.pin[1];
    if (s.pin[1] > lat1) lat1 = s.pin[1];
  }
  const latPad = Math.max(4, (lat1 - lat0) * 0.08);
  lat0 -= latPad;
  lat1 += latPad;
  const project = (lon, lat) => [
    ix + ((lon - lon0) / (lon1 - lon0)) * iw,
    iy + ((lat1 - lat) / (lat1 - lat0)) * ih,
  ];
  const out = [];
  out.push(`<defs><clipPath id="mapclip"><rect x="${n(ix)}" y="${n(iy)}" width="${n(iw)}" height="${n(ih)}"/></clipPath></defs>`);
  out.push(el('rect', { x: n(x), y: n(y), width: n(w), height: n(h), fill: SKY, stroke: INK, 'stroke-width': 1.5 }));
  out.push('<g clip-path="url(#mapclip)">');
  for (const poly of polys) {
    const d = poly.map((p, i) => {
      const [px, py] = project(p[0], p[1]);
      return `${i ? 'L' : 'M'}${n(px)},${n(py)}`;
    }).join('') + 'Z';
    out.push(el('path', { d, fill: CREAM, stroke: INK, 'stroke-width': 0.8, 'stroke-linejoin': 'round' }));
  }
  const [ex1] = project(lon0, 0);
  const [, ey] = project(0, 0);
  const [ex2] = project(lon1, 0);
  out.push(el('path', { d: `M${n(ex1)} ${n(ey)} H${n(ex2)}`, stroke: MUST, 'stroke-width': 1, fill: 'none' }));

  const pinM = 8;
  const pins = items.map((s) => {
    let [px, py] = project(s.pin[0], s.pin[1]);
    px = Math.min(Math.max(px, ix + pinM), ix + iw - pinM);
    py = Math.min(Math.max(py, iy + pinM), iy + ih - pinM);
    return { id: s.id, x: px, y: py, region: s.region };
  });
  const parent = pins.map((_, i) => i);
  const find = (a) => (parent[a] === a ? a : (parent[a] = find(parent[a])));
  for (let i = 0; i < pins.length; i++) {
    for (let j = i + 1; j < pins.length; j++) {
      if (Math.hypot(pins[i].x - pins[j].x, pins[i].y - pins[j].y) < 6) parent[find(j)] = find(i);
    }
  }
  const groups = new Map();
  pins.forEach((p, i) => {
    const f = find(i);
    if (!groups.has(f)) groups.set(f, []);
    groups.get(f).push(p);
  });
  for (const p of pins) {
    const fill = p.region === 'AME' || p.region === 'EUR' ? INK : REGION_FILL[p.region];
    out.push(el('circle', { cx: n(p.x), cy: n(p.y), r: 5, fill: CREAM, stroke: 'none' }));
    out.push(el('circle', { cx: n(p.x), cy: n(p.y), r: 3.4, fill, stroke: INK, 'stroke-width': 1 }));
  }

  const obstacles = pins.map((p) => ({ x: p.x - 6, y: p.y - 6, w: 12, h: 12 }));
  const bounds = { x: ix + 1, y: iy + 1, w: iw - 2, h: ih - 2 };
  function overlap(a, b, m = 1) {
    return a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
  }
  const dirs = [[1, -0.3], [-1, -0.3], [0.2, -1], [0.2, 1], [1.1, 0.6], [-1.1, 0.6]];
  for (const group of groups.values()) {
    const ids = group.map((p) => p.id).sort((a, b) => a - b);
    const label = ids.join('·');
    const fs = 9;
    const bw = Math.max(16, label.length * 6.2 + 6);
    const bh = 14;
    const cx = group.reduce((a, p) => a + p.x, 0) / group.length;
    const cy = group.reduce((a, p) => a + p.y, 0) / group.length;
    let box = null;
    const seeds = [];
    for (const dist of [12, 22, 34]) {
      for (const [dx, dy] of dirs) seeds.push([cx + dx * dist - bw / 2, cy + dy * dist - bh / 2]);
    }
    for (const [lx, ly] of seeds) {
      const trial = { x: lx, y: ly, w: bw, h: bh };
      if (trial.x < bounds.x || trial.y < bounds.y) continue;
      if (trial.x + trial.w > bounds.x + bounds.w || trial.y + trial.h > bounds.y + bounds.h) continue;
      if (obstacles.some((o) => overlap(o, trial, 1))) continue;
      box = trial;
      break;
    }
    if (!box) {
      box = {
        x: Math.min(Math.max(cx + 8, bounds.x), bounds.x + bounds.w - bw),
        y: Math.min(Math.max(cy - bh - 4, bounds.y), bounds.y + bounds.h - bh),
        w: bw, h: bh,
      };
    }
    obstacles.push(box);
    const lx = box.x + box.w / 2;
    const ly = box.y + box.h / 2;
    if (Math.hypot(lx - cx, ly - cy) > 16) {
      out.push(el('path', {
        d: `M${n(cx)} ${n(cy)} L${n(lx)} ${n(ly)}`,
        stroke: INK, 'stroke-width': 0.7, fill: 'none',
      }));
    }
    out.push(el('rect', {
      x: n(box.x), y: n(box.y), width: n(box.w), height: n(box.h),
      fill: CREAM, stroke: INK, 'stroke-width': 1,
    }));
    out.push(txt(box.x + bw / 2, baseline(box.y, fs, bh / fs), label, {
      family: SANS, size: fs, weight: 700, fill: INK, anchor: 'middle',
    }));
  }
  out.push('</g>');
  return out.join('');
}

const svg = buildSvg();
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>The Sunday Globe — 22 November 2026</title>
<style>
  html, body { margin: 0; padding: 0; width: 1024px; height: 1024px; overflow: hidden; background: ${PAPER}; }
  svg { display: block; width: 1024px; height: 1024px; }
</style>
</head>
<body>
${svg.replace(/^<\?xml[^>]*>\s*/, '')}
</body>
</html>
`;
const tmp = mkdtempSync(join(tmpdir(), 'globe-'));
const htmlPath = join(tmp, 'poster.html');
const rawPath = join(tmp, 'entry.raw.png');
const pngPath = join(tmp, 'entry.png');
const previewPath = join(tmp, 'preview.png');
const profile = join(tmp, 'chrome');
writeFileSync(htmlPath, html);

const chromeEnv = {
  ...process.env,
  HOME: tmp,
  TMPDIR: tmp,
  XDG_CONFIG_HOME: join(tmp, 'xdg'),
  XDG_CACHE_HOME: join(tmp, 'cache'),
};
function launchChrome(extra, timeout) {
  return spawnSync('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    ...extra,
    '--window-size=1024,1024',
    `--screenshot=${rawPath}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: 'inherit', timeout, env: chromeEnv });
}
let chrome = launchChrome([`--user-data-dir=${profile}`], 20000);
if (chrome.status !== 0 || !existsSync(rawPath)) {
  spawnSync('pkill', ['-f', profile], { stdio: 'ignore' });
  try { unlinkSync(rawPath); } catch { /* no partial screenshot */ }
  chrome = launchChrome([], 40000);
}
if (chrome.status !== 0 || !existsSync(rawPath)) process.exit(chrome.status ?? 1);

const py = spawnSync('python3', ['-c', `
from PIL import Image
import os
raw, png, preview = ${JSON.stringify(rawPath)}, ${JSON.stringify(pngPath)}, ${JSON.stringify(previewPath)}
im = Image.open(raw)
if im.mode == 'RGBA':
    bg = Image.new('RGB', im.size, (246, 240, 228))
    bg.paste(im, mask=im.split()[-1])
    im = bg
else:
    im = im.convert('RGB')
if im.size != (1024, 1024):
    raise SystemExit(f'bad size {im.size} {im.mode}')
im.save(png, 'PNG', optimize=True)
im.resize((300, 300), Image.Resampling.LANCZOS).save(preview, 'PNG', optimize=True)
print(f'{png} {os.path.getsize(png)} bytes RGB {im.size[0]}x{im.size[1]}')
print('Layout: 49-story Sunday Globe, 14px margin, 72px date, four 140px lead arts, ten mids, 35 one-line briefs beside a 330px map.')
`], { encoding: 'utf8' });
if (py.status !== 0) {
  console.error(py.stderr);
  process.exit(py.status ?? 1);
}
process.stdout.write(py.stdout);

function copyPublished(src, dest) {
  try {
    copyFileSync(src, dest);
    return true;
  } catch (err) {
    if (err.code === 'EROFS' || err.code === 'EACCES' || err.code === 'EPERM') return false;
    throw err;
  }
}
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
let published = false;
try {
  mkdirSync(outDir, { recursive: true });
  published = copyPublished(pngPath, join(outDir, 'entry.png'));
} catch (err) {
  if (err.code !== 'EROFS' && err.code !== 'EACCES' && err.code !== 'EPERM') throw err;
}
const localPng = copyPublished(pngPath, join(root, 'entry.png'));
copyPublished(previewPath, join(root, 'preview.png'));
copyPublished(htmlPath, join(root, 'poster.html'));
if (!published && !localPng) {
  console.error('entry.png could not be written');
  process.exit(1);
}
const shown = localPng ? join(root, 'entry.png') : join(outDir, 'entry.png');
console.log(`${shown} ${statSync(shown).size} bytes`);
console.log(REGIONS.map((r) => `${r} ${counts[r]}`).join(' '));
