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

const stories = [...news.stories].sort((a, b) => a.id - b.id);
if (stories.length < 45 || stories.length > 49) {
  throw new Error(`story count ${stories.length}`);
}
const leads = stories.filter((s) => s.tier === 'lead');
const mids = stories.filter((s) => s.tier === 'mid');
const briefs = stories.filter((s) => s.tier === 'brief');
if (leads.length !== 4 || mids.length !== 10) {
  throw new Error('expected 4 leads and 10 mids');
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

function scoop(cx, cy, s) {
  const r = 8 * s;
  const brim = cy - r * 0.72;
  const out = [];
  out.push(shape('path', {
    d: `M${n(cx - r * 1.2)} ${n(brim)} L${n(cx - r * 0.72)} ${n(brim - r * 0.78)} H${n(cx + r * 0.72)} L${n(cx + r * 1.2)} ${n(brim)} Z`,
    fill: CREAM,
  }));
  out.push(el('rect', {
    x: n(cx - r * 0.5), y: n(brim - r * 0.62), width: n(r), height: n(r * 0.26),
    fill: RED, stroke: 'none',
  }));
  out.push(shape('circle', { cx: n(cx), cy: n(cy), r: n(r), fill: SKY }));
  out.push(shape('ellipse', { cx: n(cx), cy: n(cy), rx: n(r * 0.4), ry: n(r), fill: 'none', 'stroke-width': 1.5 }));
  out.push(shape('path', { d: `M${n(cx - r)} ${n(cy)} H${n(cx + r)}`, fill: 'none', 'stroke-width': 1.5 }));
  out.push(el('circle', { cx: n(cx - r * 0.32), cy: n(cy - r * 0.06), r: n(1.15 * s), fill: INK, stroke: 'none' }));
  out.push(el('circle', { cx: n(cx + r * 0.34), cy: n(cy - r * 0.06), r: n(1.15 * s), fill: INK, stroke: 'none' }));
  out.push(shape('path', {
    d: `M${n(cx - r * 0.62)} ${n(cy - r * 0.32)} Q${n(cx - r * 0.32)} ${n(cy - r * 0.7)} ${n(cx - r * 0.02)} ${n(cy - r * 0.3)}`,
    fill: 'none',
  }));
  out.push(shape('path', {
    d: `M${n(cx + r * 0.1)} ${n(cy - r * 0.4)} H${n(cx + r * 0.62)}`,
    fill: 'none',
  }));
  out.push(shape('path', {
    d: `M${n(cx - r * 0.26)} ${n(cy + r * 0.36)} Q${n(cx)} ${n(cy + r * 0.58)} ${n(cx + r * 0.26)} ${n(cy + r * 0.36)}`,
    fill: 'none', 'stroke-width': 1.5,
  }));
  return out.join('');
}

function bubble(x, y, w, h, label) {
  return [
    shape('rect', { x: n(x), y: n(y), width: n(w), height: n(h), rx: 2, fill: CREAM }),
    shape('path', {
      d: `M${n(x + 10)} ${n(y + h - 1)} L${n(x + 6)} ${n(y + h + 6)} L${n(x + 22)} ${n(y + h - 1)}`,
      fill: CREAM,
    }),
    el('rect', { x: n(x + 8), y: n(y + h - 3), width: 16, height: 5, fill: CREAM, stroke: 'none' }),
    txt(x + w / 2, y + h * 0.72, label, { family: SANS, size: 8, weight: 700, fill: INK, anchor: 'middle' }),
  ].join('');
}

function frame(w, h) {
  return shape('rect', { x: 1, y: 1, width: n(w - 2), height: n(h - 2), fill: 'none' });
}

function artCop(w, h) {
  return [
    el('rect', { width: w, height: h, fill: SKY, stroke: 'none' }),
    el('rect', { y: n(h * 0.7), width: w, height: n(h * 0.3), fill: MUST, stroke: 'none' }),
    shape('circle', { cx: 30, cy: 26, r: 13, fill: MUST }),
    shape('rect', { x: 82, y: 36, width: 70, height: 42, fill: CREAM }),
    shape('rect', { x: 108, y: 58, width: 16, height: 20, fill: TEAL }),
    el('rect', { x: 90, y: 42, width: 54, height: 12, fill: RED, stroke: 'none' }),
    txt(117, 51.5, 'COP31', { family: SANS, size: 8, weight: 700, fill: WHITE, anchor: 'middle' }),
    shape('circle', { cx: 188, cy: 32, r: 16, fill: CREAM }),
    shape('path', { d: 'M188 32 V20 M188 32 L198 36', fill: 'none' }),
    el('circle', { cx: 188, cy: 32, r: 1.6, fill: INK, stroke: 'none' }),
    [0, 1, 2].map((i) => shape('circle', { cx: 150 + i * 16, cy: 92, r: 6, fill: i === 1 ? CORAL : TEAL })).join(''),
    scoop(40, 86, 0.9),
    bubble(46, 6, 82, 16, 'No gavel yet.'),
    frame(w, h),
  ].join('');
}

function artBahrain(w, h) {
  return [
    el('rect', { width: w, height: h, fill: CREAM, stroke: 'none' }),
    el('rect', { y: 72, width: w, height: n(h - 72), fill: TEAL, stroke: 'none' }),
    shape('path', { d: 'M18 28 H46 M24 22 H40', fill: 'none' }),
    shape('path', { d: 'M32 22 V40', fill: 'none' }),
    shape('circle', { cx: 32, cy: 18, r: 4, fill: SKY }),
    [70, 112, 154].map((cx, i) => shape('ellipse', {
      cx, cy: 62, rx: 18, ry: 14, fill: i === 1 ? CORAL : CREAM,
    })).join(''),
    shape('path', { d: 'M104 48 L112 28 L120 48 Z', fill: RED }),
    shape('path', { d: 'M108 40 L114 22 L118 36', fill: MUST, 'stroke-width': 1.5 }),
    shape('path', { d: 'M40 48 Q90 20 150 36', fill: 'none', stroke: CORAL }),
    shape('path', { d: 'M48 58 Q100 28 168 46', fill: 'none', stroke: SKY }),
    frame(w, h),
  ].join('');
}

function artSparta(w, h) {
  return [
    el('rect', { width: w, height: h, fill: TEAL, stroke: 'none' }),
    shape('path', { d: `M0 78 Q28 70 56 78 T112 78 T168 78 T224 78`, fill: 'none', stroke: CREAM, 'stroke-width': 2 }),
    shape('path', { d: `M0 92 Q30 84 60 92 T120 92 T180 92 T226 92`, fill: 'none', stroke: SKY, 'stroke-width': 2 }),
    shape('path', { d: 'M48 70 L70 48 H150 L176 70 Z', fill: INK }),
    shape('rect', { x: 86, y: 34, width: 36, height: 18, fill: CREAM }),
    shape('path', { d: 'M118 34 V22', fill: 'none' }),
    shape('path', { d: 'M128 46 L140 24 L148 46 Z', fill: RED }),
    shape('circle', { cx: 156, cy: 28, r: 8, fill: CREAM }),
    shape('circle', { cx: 170, cy: 18, r: 6, fill: PAPER, 'stroke-width': 1.5 }),
    frame(w, h),
  ].join('');
}

function artPant(w, h) {
  return [
    el('rect', { width: w, height: 48, fill: SKY, stroke: 'none' }),
    el('rect', { y: 48, width: w, height: n(h - 48), fill: TEAL, stroke: 'none' }),
    shape('rect', { x: 70, y: 58, width: 70, height: 40, fill: CREAM }),
    shape('path', { d: 'M100 58 V98 M78 78 H132', fill: 'none', 'stroke-width': 1.5 }),
    shape('path', { d: 'M96 96 V86 M104 96 V86 M100 86 V80', fill: 'none' }),
    shape('circle', { cx: 124, cy: 70, r: 7, fill: MUST }),
    shape('path', { d: 'M124 77 V96 M116 84 H132 M118 96 H130', fill: 'none' }),
    shape('path', { d: 'M128 72 L158 40 L164 48 L134 78 Z', fill: MUST }),
    el('circle', { cx: 150, cy: 36, r: 5, fill: RED, stroke: INK, 'stroke-width': 2 }),
    shape('rect', { x: 168, y: 14, width: 46, height: 22, fill: CREAM }),
    txt(191, 30, '128', { family: PLAY, size: 14, weight: 700, fill: INK, anchor: 'middle' }),
    scoop(36, 78, 0.85),
    bubble(52, 6, 86, 16, 'Look surprised.'),
    frame(w, h),
  ].join('');
}

function artHk(w, h) {
  const barW = w - 70;
  return [
    el('rect', { width: w, height: h, fill: CREAM, stroke: 'none' }),
    shape('rect', { x: 8, y: 8, width: 36, height: 38, fill: RED }),
    el('rect', { x: 20, y: 8, width: 12, height: 8, fill: CREAM, stroke: 'none' }),
    shape('rect', { x: 56, y: 22, width: barW, height: 12, fill: PAPER }),
    el('rect', { x: 56, y: 22, width: n(barW * 0.45), height: 12, fill: MUST, stroke: 'none' }),
    txt(58, 16, '45% first hour', { family: SANS, size: 9, weight: 700, fill: INK }),
    frame(w, h),
  ].join('');
}

function artMexico(w, h) {
  const fig = (x, fill) => [
    shape('circle', { cx: x, cy: 16, r: 6, fill }),
    shape('rect', { x: x - 7, y: 24, width: 14, height: 18, fill }),
  ].join('');
  return [
    el('rect', { width: w, height: h, fill: MUST, stroke: 'none' }),
    fig(36, TEAL), fig(62, CORAL), fig(88, TEAL),
    shape('rect', { x: 112, y: 14, width: 52, height: 22, fill: RED }),
    txt(138, 29, 'HELD', { family: SANS, size: 11, weight: 700, fill: WHITE, anchor: 'middle' }),
    frame(w, h),
  ].join('');
}

function artNato(w, h) {
  return [
    el('rect', { width: w, height: h, fill: CREAM, stroke: 'none' }),
    shape('path', {
      d: 'M28 8 L52 8 L60 28 L40 48 L20 28 Z',
      fill: TEAL,
    }),
    shape('path', { d: 'M40 16 V36 M30 26 H50', fill: 'none', stroke: WHITE, 'stroke-width': 2 }),
    scoop(148, 34, 0.7),
    bubble(78, 4, 64, 14, 'Every inch.'),
    frame(w, h),
  ].join('');
}

function artTalks(w, h) {
  return [
    el('rect', { width: w, height: h, fill: PAPER, stroke: 'none' }),
    shape('rect', { x: 16, y: 18, width: 28, height: 26, fill: TEAL }),
    shape('rect', { x: 16, y: 10, width: 8, height: 20, fill: TEAL }),
    shape('rect', { x: 132, y: 18, width: 28, height: 26, fill: CORAL }),
    shape('rect', { x: 152, y: 10, width: 8, height: 20, fill: CORAL }),
    shape('rect', { x: 52, y: 28, width: 72, height: 8, fill: MUST }),
    shape('path', { d: 'M78 8 H96 L92 20 H74 Z', fill: SKY }),
    shape('path', { d: 'M100 8 H112 L120 20 H104 Z', fill: CREAM }),
    frame(w, h),
  ].join('');
}

function artPower(w, h) {
  return [
    el('rect', { width: w, height: h, fill: PAPER, stroke: 'none' }),
    shape('rect', { x: 8, y: 22, width: 22, height: 28, fill: INK }),
    shape('rect', { x: 34, y: 10, width: 26, height: 40, fill: INK }),
    shape('rect', { x: 64, y: 18, width: 20, height: 32, fill: INK }),
    el('rect', { x: 14, y: 28, width: 6, height: 6, fill: MUST, stroke: 'none' }),
    el('rect', { x: 40, y: 16, width: 6, height: 6, fill: PAPER, stroke: 'none' }),
    el('rect', { x: 50, y: 28, width: 6, height: 6, fill: MUST, stroke: 'none' }),
    shape('circle', { cx: 130, cy: 24, r: 14, fill: CREAM }),
    el('path', { d: 'M116 24 H144', stroke: 'none', fill: 'none' }),
    el('rect', { x: 116, y: 24, width: 28, height: 14, fill: PAPER, stroke: 'none' }),
    shape('rect', { x: 124, y: 36, width: 12, height: 6, fill: INK }),
    frame(w, h),
  ].join('');
}

function artIcu(w, h) {
  return [
    el('rect', { width: w, height: h, fill: CREAM, stroke: 'none' }),
    shape('rect', { x: 8, y: 28, width: 78, height: 16, fill: PAPER }),
    shape('path', { d: 'M8 28 V22 H86 V28', fill: 'none' }),
    shape('rect', { x: 100, y: 8, width: 64, height: 28, fill: INK }),
    shape('path', {
      d: 'M106 22 H118 L124 12 L132 30 L140 18 H158',
      fill: 'none', stroke: TEAL, 'stroke-width': 2,
    }),
    shape('rect', { x: 78, y: 8, width: 14, height: 14, fill: TEAL }),
    el('path', { d: 'M85 10 V20 M80 15 H90', stroke: WHITE, 'stroke-width': 2, fill: 'none' }),
    frame(w, h),
  ].join('');
}

function artTennis(w, h) {
  return [
    el('rect', { width: w, height: h, fill: TEAL, stroke: 'none' }),
    shape('rect', { x: 8, y: 8, width: 100, height: 38, fill: CREAM }),
    shape('path', { d: 'M58 8 V46 M8 27 H108', fill: 'none', 'stroke-width': 1.5 }),
    shape('circle', { cx: 28, cy: 20, r: 5, fill: CORAL }),
    shape('circle', { cx: 86, cy: 34, r: 5, fill: SKY }),
    shape('path', { d: 'M124 40 L132 12 H148 L156 40 Z', fill: MUST }),
    shape('rect', { x: 130, y: 8, width: 20, height: 6, fill: RED }),
    scoop(168, 36, 0.62),
    bubble(112, 2, 62, 13, 'Still boxed.'),
    frame(w, h),
  ].join('');
}

function artMcg(w, h) {
  return [
    el('rect', { width: w, height: h, fill: SKY, stroke: 'none' }),
    shape('path', { d: `M16 ${h - 8} Q${w / 2} 10 ${w - 16} ${h - 8}`, fill: CREAM }),
    txt(48, 36, '70', { family: PLAY, size: 26, weight: 700, fill: RED }),
    shape('path', { d: 'M120 34 C120 18 148 18 148 34', fill: 'none' }),
    shape('path', { d: 'M128 34 V46 H140 V34', fill: 'none' }),
    el('path', { d: 'M134 22 L138 14 L142 22 Z', fill: MUST, stroke: INK, 'stroke-width': 2 }),
    frame(w, h),
  ].join('');
}

function artAukus(w, h) {
  return [
    el('rect', { width: w, height: h, fill: CREAM, stroke: 'none' }),
    shape('ellipse', { cx: 70, cy: 32, rx: 52, ry: 14, fill: TEAL }),
    shape('rect', { x: 78, y: 12, width: 16, height: 14, fill: TEAL }),
    shape('path', { d: 'M20 26 L8 20 V44 L20 38 Z', fill: TEAL }),
    shape('rect', { x: 128, y: 10, width: 36, height: 30, fill: PAPER }),
    shape('path', { d: 'M134 16 L158 34 M158 16 L134 34', fill: 'none', stroke: RED, 'stroke-width': 2 }),
    frame(w, h),
  ].join('');
}

function artBoat(w, h) {
  return [
    el('rect', { width: w, height: h, fill: SKY, stroke: 'none' }),
    el('rect', { y: 28, width: w, height: n(h - 28), fill: TEAL, stroke: 'none' }),
    shape('path', { d: 'M36 30 L48 44 H120 L132 30 Z', fill: MUST }),
    shape('path', { d: 'M70 30 V14 H98 V30', fill: 'none' }),
    shape('circle', { cx: 150, cy: 24, r: 10, fill: CREAM }),
    shape('circle', { cx: 150, cy: 24, r: 4, fill: 'none' }),
    frame(w, h),
  ].join('');
}

const ART = {
  cop31: artCop, bahrain: artBahrain, sparta: artSparta, pant: artPant,
  hk: artHk, mexico: artMexico, nato: artNato, talks: artTalks, power: artPower,
  icu: artIcu, tennis: artTennis, mcg: artMcg, aukus: artAukus, boat: artBoat,
};

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
for (const s of stories) {
  if (!s.pin) continue;
  const hit = onLand(s.pin[0], s.pin[1]);
  if (s.water && hit) throw new Error(`sea pin ${s.id} sits on land`);
  if (!s.water && !hit) throw new Error(`land pin ${s.id} is off the map shapes`);
}

function segmentWidths(total) {
  const sum = REGIONS.reduce((a, r) => a + counts[r], 0);
  const raw = REGIONS.map((r) => (total * counts[r]) / sum);
  const widths = raw.map((v) => Math.floor(v));
  let left = total - widths.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < left; k++) widths[order[k][1]] += 1;
  return widths;
}

function buildSvg() {
  const W = 1024;
  const M = 16;
  const inner = W - M * 2;
  const parts = [];
  parts.push(el('rect', { width: W, height: W, fill: PAPER, stroke: 'none' }));

  let y = M;
  const kickerFs = 13;
  const kickerBase = baseline(y, kickerFs, 1.2);
  parts.push(txt(M, kickerBase, news.masthead, { family: SANS, size: kickerFs, weight: 700, fill: RED }));
  parts.push(txt(M + 158, kickerBase, `${stories.length} STORIES · 7 REGIONS · SUNDAY 22 NOVEMBER 2026`, {
    family: SANS, size: 11, weight: 600, fill: INK,
  }));
  y += 16 + 1;

  const dateFs = 40;
  const dateLh = 1.16;
  parts.push(txt(M, baseline(y, dateFs, dateLh), news.date, {
    family: PLAY, size: dateFs, weight: 700, fill: INK,
  }));
  y += dateFs * dateLh + 2;

  const standFs = 12.5;
  const standLh = 1.3;
  parts.push(txt(M, baseline(y, standFs, standLh), news.standfirst, {
    family: SERIF, size: standFs, weight: 400, fill: INK,
  }));
  y += standFs * standLh + 3;

  const scoopH = 26;
  parts.push(shape('rect', { x: M, y: n(y), width: inner, height: scoopH, fill: CREAM, 'stroke-width': 1.5 }));
  parts.push(scoop(M + 18, y + 15, 0.72));
  parts.push(txt(M + 36, y + 17, `Scoop · ${news.scoopLine}`, {
    family: SERIF, size: 12, weight: 400, fill: INK,
  }));
  y += scoopH + 4;

  const kpiH = 40;
  const kpiGap = 6;
  const kpiW = Math.floor((inner - kpiGap * 5) / 6);
  const labelFs = 8;
  const labelLh = 1.2;
  const valueFs = 13;
  const valueLh = 1.15;
  const kpiBlock = labelFs * labelLh + 2 + valueFs * valueLh;
  const kpiPad = (kpiH - kpiBlock) / 2;
  news.kpis.forEach((k, i) => {
    const x = M + i * (kpiW + kpiGap);
    parts.push(shape('rect', { x: n(x), y: n(y), width: kpiW, height: kpiH, fill: CREAM, 'stroke-width': 1.5 }));
    const anchor = k.align === 'right' ? 'end' : 'start';
    const tx = k.align === 'right' ? x + kpiW - 8 : x + 8;
    parts.push(txt(tx, baseline(y + kpiPad, labelFs, labelLh), k.label, {
      family: SANS, size: labelFs, weight: 700, fill: INK, anchor,
    }));
    parts.push(txt(tx, baseline(y + kpiPad + labelFs * labelLh + 2, valueFs, valueLh), k.value, {
      family: SANS, size: valueFs, weight: 700, fill: INK, anchor,
    }));
  });
  y += kpiH + 3;

  const tickH = 16;
  const tickW = inner / news.ticks.length;
  news.ticks.forEach((t, i) => {
    const cx = M + tickW * i + tickW / 2;
    parts.push(txt(cx, baseline(y, 9, 1.25), t, {
      family: SANS, size: 9, weight: 600, fill: INK, anchor: 'middle',
    }));
  });
  y += tickH + 3;

  const regionH = 22;
  const widths = segmentWidths(inner);
  let rx = M;
  REGIONS.forEach((r, i) => {
    parts.push(el('rect', {
      x: n(rx), y: n(y), width: widths[i], height: regionH,
      fill: REGION_FILL[r], stroke: INK, 'stroke-width': 1,
    }));
    parts.push(txt(rx + 6, y + 15, `${r} ${counts[r]}`, {
      family: SANS, size: 11, weight: 700, fill: REGION_INK[r],
    }));
    rx += widths[i];
  });
  y += regionH + 5;

  const gap = 8;
  const leadW = (inner - gap * 3) / 4;
  const pad = 8;
  const artH = 110;
  const artGap = 10;
  const titleFs = 13;
  const titleLh = 1.18;
  const beforeDeck = 4;
  const deckFs = 10.5;
  const deckLh = 1.32;
  const beforeMeta = 3;
  const metaFs = 8.5;
  const metaLh = 1.3;
  const leadH = pad + artH + artGap + titleFs * titleLh * 2 + beforeDeck + deckFs * deckLh * 2 + beforeMeta + metaFs * metaLh + pad;

  leads.forEach((s, i) => {
    const x = M + i * (leadW + gap);
    parts.push(shape('rect', { x: n(x), y: n(y), width: n(leadW), height: n(leadH), fill: CREAM, 'stroke-width': 1.5 }));
    const aw = leadW - pad * 2;
    parts.push(`<g transform="translate(${n(x + pad)},${n(y + pad)})">${ART[s.art](aw, artH)}</g>`);
    let ty = y + pad + artH + artGap;
    s.title.forEach((line, li) => {
      parts.push(txt(x + pad, baseline(ty, titleFs, titleLh, li), line, {
        family: PLAY, size: titleFs, weight: 700, fill: INK,
      }));
    });
    ty += titleFs * titleLh * 2 + beforeDeck;
    s.deck.forEach((line, li) => {
      parts.push(txt(x + pad, baseline(ty, deckFs, deckLh, li), line, {
        family: SERIF, size: deckFs, weight: 400, fill: INK,
      }));
    });
    ty += deckFs * deckLh * 2 + beforeMeta;
    const meta = `${String(s.id).padStart(2, '0')} · ${s.tag} · ${s.source}`;
    parts.push(txt(x + pad, baseline(ty, metaFs, metaLh), meta, {
      family: SANS, size: metaFs, weight: 700, fill: TAG_FILL[s.tag],
    }));
  });
  y += leadH + 5;

  const midW = (inner - gap * 4) / 5;
  const midArt = 54;
  const midArtGap = 8;
  const midTitleFs = 11.5;
  const midTitleLh = 1.18;
  const midBefore = 3;
  const midDeckFs = 9.5;
  const midDeckLh = 1.32;
  const midMetaFs = 8;
  const midMetaLh = 1.3;
  const midH = pad + midArt + midArtGap + midTitleFs * midTitleLh * 2 + midBefore + midDeckFs * midDeckLh + 2 + midMetaFs * midMetaLh + pad;

  mids.forEach((s, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = M + col * (midW + gap);
    const cy = y + row * (midH + 5);
    parts.push(shape('rect', { x: n(x), y: n(cy), width: n(midW), height: n(midH), fill: CREAM, 'stroke-width': 1.5 }));
    const aw = midW - pad * 2;
    parts.push(`<g transform="translate(${n(x + pad)},${n(cy + pad)})">${ART[s.art](aw, midArt)}</g>`);
    let ty = cy + pad + midArt + midArtGap;
    s.title.forEach((line, li) => {
      parts.push(txt(x + pad, baseline(ty, midTitleFs, midTitleLh, li), line, {
        family: PLAY, size: midTitleFs, weight: 700, fill: INK,
      }));
    });
    ty += midTitleFs * midTitleLh * 2 + midBefore;
    parts.push(txt(x + pad, baseline(ty, midDeckFs, midDeckLh), s.deck[0], {
      family: SERIF, size: midDeckFs, weight: 400, fill: INK,
    }));
    ty += midDeckFs * midDeckLh + 2;
    const meta = `${String(s.id).padStart(2, '0')} · ${s.tag} · ${s.source}`;
    parts.push(txt(x + pad, baseline(ty, midMetaFs, midMetaLh), meta, {
      family: SANS, size: midMetaFs, weight: 700, fill: TAG_FILL[s.tag],
    }));
  });
  y += midH * 2 + 5 + 5;

  const bottomLimit = W - M;
  const dateFs2 = 10.5;
  const dateLh2 = 1.3;
  const dateH = 7 + dateFs2 * dateLh2 + 7;
  const footFs = 10;
  const footH = footFs * 1.3;
  const mapTop = y;
  const mapBottom = bottomLimit - dateH - 4 - footH - 3;
  if (mapBottom - mapTop < 180) throw new Error(`map band too short ${mapBottom - mapTop}`);

  const mapW = 268;
  const briefsX = M + mapW + 8;
  const titleFs2 = 11;
  parts.push(txt(M, baseline(mapTop, titleFs2, 1.2), 'WHERE IT HAPPENED', {
    family: SANS, size: titleFs2, weight: 700, fill: INK,
  }));
  parts.push(txt(briefsX, baseline(mapTop, titleFs2, 1.2), 'REGIONAL BRIEFS', {
    family: SANS, size: titleFs2, weight: 700, fill: INK,
  }));
  const bodyTop = mapTop + titleFs2 * 1.2 + 3;
  const bodyH = mapBottom - bodyTop;
  parts.push(drawMap(M, bodyTop, mapW, bodyH, stories));

  const colGap = 8;
  const briefsW = inner - mapW - 8;
  const colW = (briefsW - colGap * 2) / 3;
  const groups = [['EUR'], ['MEA', 'AFR', 'SAS'], ['EAS', 'OCE', 'AME']];
  const bFs = 8.5;
  const bLh = 1.28;
  const bGap = 2;
  groups.forEach((regs, ci) => {
    const x = briefsX + ci * (colW + colGap);
    let by = bodyTop;
    for (const r of regs) {
      parts.push(el('rect', {
        x: n(x), y: n(by + 2), width: 7, height: 7, fill: REGION_FILL[r], stroke: INK, 'stroke-width': 1,
      }));
      parts.push(txt(x + 11, baseline(by, bFs, bLh), REGION_NAME[r], {
        family: SANS, size: bFs, weight: 700, fill: INK,
      }));
      by += bFs * bLh + bGap;
      for (const s of briefs.filter((b) => b.region === r)) {
        const line = `${s.id} ${s.line} ${s.tag} · ${s.source}`;
        parts.push(txt(x, baseline(by, bFs, bLh), line, {
          family: SANS, size: bFs, weight: 500, fill: INK,
        }));
        by += bFs * bLh + bGap;
      }
    }
    if (by > mapBottom + 1) throw new Error(`briefs column ${ci} overflow ${by} > ${mapBottom}`);
  });

  y = mapBottom + 4;
  parts.push(el('rect', { x: M, y: n(y), width: inner, height: n(dateH), fill: RED, stroke: 'none' }));
  parts.push(txt(M + 8, baseline(y + 7, dateFs2, dateLh2), news.dateCheck, {
    family: SANS, size: dateFs2, weight: 700, fill: WHITE,
  }));
  y += dateH + 3;
  parts.push(txt(M, baseline(y, footFs, 1.3), news.footer, {
    family: SANS, size: footFs, weight: 500, fill: INK,
  }));
  y += footH;
  if (y > bottomLimit + 0.5) throw new Error(`plate overflow ${y}`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
${parts.join('\n')}
</svg>`;
}

function drawMap(x, y, w, h, items) {
  const pad = 8;
  const ix = x + pad;
  const iy = y + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  const inset = 6;
  const px0 = ix + inset;
  const py0 = iy + inset;
  const pw = iw - inset * 2;
  const ph = ih - inset * 2;
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
    if (!s.pin) continue;
    if (s.pin[1] < lat0) lat0 = s.pin[1];
    if (s.pin[1] > lat1) lat1 = s.pin[1];
  }
  const latPad = Math.max(6, (lat1 - lat0) * 0.06);
  lat0 -= latPad;
  lat1 += latPad;
  const project = (lon, lat) => [
    px0 + ((lon - lon0) / (lon1 - lon0)) * pw,
    py0 + ((lat1 - lat) / (lat1 - lat0)) * ph,
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
    out.push(el('path', { d, fill: CREAM, stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round' }));
  }
  const [ex1] = project(lon0, 0);
  const [, ey] = project(0, 0);
  const [ex2] = project(lon1, 0);
  out.push(el('path', { d: `M${n(ex1)} ${n(ey)} H${n(ex2)}`, stroke: MUST, 'stroke-width': 1, fill: 'none' }));

  const pinM = 5;
  const pins = items.filter((s) => s.pin).map((s) => {
    let [px, py] = project(s.pin[0], s.pin[1]);
    px = Math.min(Math.max(px, ix + pinM), ix + iw - pinM);
    py = Math.min(Math.max(py, iy + pinM), iy + ih - pinM);
    return { id: s.id, x: px, y: py, lon: s.pin[0], lat: s.pin[1], region: s.region };
  });
  const parent = pins.map((_, i) => i);
  const find = (a) => (parent[a] === a ? a : (parent[a] = find(parent[a])));
  for (let i = 0; i < pins.length; i++) {
    for (let j = i + 1; j < pins.length; j++) {
      if (Math.hypot(pins[i].x - pins[j].x, pins[i].y - pins[j].y) < 9) parent[find(j)] = find(i);
    }
  }
  const groups = new Map();
  pins.forEach((p, i) => {
    const f = find(i);
    if (!groups.has(f)) groups.set(f, []);
    groups.get(f).push(p);
  });

  for (const p of pins) {
    const fill = p.region === 'AME' ? INK : REGION_FILL[p.region];
    out.push(el('circle', { cx: n(p.x), cy: n(p.y), r: 4.2, fill: CREAM, stroke: 'none' }));
    out.push(el('circle', { cx: n(p.x), cy: n(p.y), r: 3.1, fill, stroke: INK, 'stroke-width': 1 }));
  }

  const obstacles = pins.map((p) => ({ x: p.x - 4, y: p.y - 4, w: 8, h: 8 }));
  const bounds = { x: ix + 1, y: iy + 1, w: iw - 2, h: ih - 2 };
  function overlap(a, b, m = 1) {
    return a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
  }
  function wrapIds(ids) {
    const sorted = [...ids].sort((a, b) => a - b);
    const tokens = [];
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j += 1;
      tokens.push(j >= i + 2 ? `${sorted[i]}–${sorted[j]}` : sorted.slice(i, j + 1).join('·'));
      i = j + 1;
    }
    const lines = [];
    let cur = '';
    for (const t of tokens) {
      const next = cur ? `${cur}·${t}` : t;
      if (next.length > 11 && cur) {
        lines.push(cur);
        cur = t;
      } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  for (const group of groups.values()) {
    const ids = group.map((p) => p.id);
    const lines = wrapIds(ids);
    const fs = 7.5;
    const lh = fs * 1.25;
    const bw = Math.max(...lines.map((l) => l.length * 4.15)) + 6;
    const bh = lines.length * lh + 3;
    const cx = group.reduce((a, p) => a + p.x, 0) / group.length;
    const cy = group.reduce((a, p) => a + p.y, 0) / group.length;
    const lon = group.reduce((a, p) => a + p.lon, 0) / group.length;
    const lat = group.reduce((a, p) => a + p.lat, 0) / group.length;
    let prefer = null;
    if (group.length >= 5 && lon < 45 && lat > 28) prefer = project(-40, 50);
    else if (group.length >= 4 && lat < -25 && lon > 120 && lon < 165) prefer = project(145, -50);
    else if (lon > 165 && lat < -30) prefer = project(162, -36);
    const dirs = [[-1, -0.2], [1, -0.2], [0, -1], [0, 1], [-1, 0.6], [1, 0.7], [-0.4, -1.2], [1.2, -0.8]];
    let box = null;
    const seeds = prefer ? [[prefer[0] - bw / 2, prefer[1] - bh / 2]] : [];
    for (const dist of [14, 26, 40, 58]) {
      for (const [dx, dy] of dirs) seeds.push([cx + dx * dist - bw / 2, cy + dy * dist - bh / 2]);
    }
    for (const [lx, ly] of seeds) {
      const trial = { x: lx, y: ly, w: bw, h: bh };
      if (trial.x < bounds.x + 1 || trial.y < bounds.y + 1) continue;
      if (trial.x + trial.w > bounds.x + bounds.w - 1 || trial.y + trial.h > bounds.y + bounds.h - 1) continue;
      if (obstacles.some((o) => overlap(o, trial, 1))) continue;
      box = trial;
      break;
    }
    if (!box) {
      const minX = bounds.x;
      const minY = bounds.y;
      const maxX = bounds.x + bounds.w - bw;
      const maxY = bounds.y + bounds.h - bh;
      box = {
        x: maxX >= minX ? Math.min(Math.max(cx + 6, minX), maxX) : minX,
        y: maxY >= minY ? Math.min(Math.max(cy - bh - 4, minY), maxY) : minY,
        w: bw, h: bh,
      };
    }
    obstacles.push(box);
    out.push(el('rect', {
      x: n(box.x), y: n(box.y), width: n(box.w), height: n(box.h),
      fill: CREAM, stroke: INK, 'stroke-width': 1,
    }));
    const near = Math.hypot(cx - (box.x + box.w / 2), cy - (box.y + box.h / 2)) < 16;
    if (!near) {
      out.push(el('path', {
        d: `M${n(cx)} ${n(cy)} L${n(box.x + box.w / 2)} ${n(box.y + box.h / 2)}`,
        stroke: INK, 'stroke-width': 0.8, fill: 'none',
      }));
    }
    lines.forEach((line, li) => {
      out.push(txt(box.x + 3, box.y + 2 + baseline(0, fs, 1.25, li), line, {
        family: SANS, size: fs, weight: 700, fill: INK,
      }));
    });
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
let chrome = launchChrome([`--user-data-dir=${profile}`], 12000);
if (chrome.status !== 0 || !existsSync(rawPath)) {
  spawnSync('pkill', ['-f', profile], { stdio: 'ignore' });
  try { unlinkSync(rawPath); } catch { /* no partial screenshot */ }
  chrome = launchChrome([], 30000);
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
print('Layout: 48-story cartoon Sunday Globe, 16px margin, 4 lead cards, 10 mids, briefs beside a lon/lat map.')
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
