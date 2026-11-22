import { readFile, writeFile, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = dirname(here);
const data = JSON.parse(await readFile(join(root, "news.json"), "utf8"));

const COLOR = {
  EUR: "#1E3A5F",
  MEA: "#8C3A2F",
  AFR: "#2F5D38",
  SAS: "#8A5A12",
  EAS: "#0E6B6B",
  OCE: "#1F4E79",
  AME: "#5C3D6E",
  GLB: "#3E4651",
};

const counts = Object.fromEntries(data.regionOrder.map((code) => [code, 0]));
for (const story of data.stories) counts[story.region] += 1;

function esc(value) {
  return String(value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function br(value) {
  return esc(value).replace(/\n/g, "<br>");
}

function cricket() {
  const seats = [];
  for (let row = 0; row < 4; row += 1) {
    for (let i = 0; i < 16; i += 1) {
      seats.push(`<circle cx="${10 + i * 13}" cy="${22 + row * 7}" r="1.7" fill="#F4EFE4"/>`);
    }
  }
  return `<svg class="draw" viewBox="0 0 226 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="226" height="140" fill="#C5D7EA"/>
    <path d="M0 46 H226 V78 H0 Z" fill="#243246"/>
    <path d="M0 46 Q14 32 28 46 Q42 32 56 46 Q70 32 84 46 Q98 32 112 46 Q126 32 140 46 Q154 32 168 46 Q182 32 196 46 Q210 32 226 46 V58 H0 Z" fill="#31465F"/>
    ${seats.join("")}
    <ellipse cx="118" cy="112" rx="108" ry="34" fill="#2C6B40"/>
    <ellipse cx="118" cy="114" rx="72" ry="18" fill="#3C8452"/>
    <rect x="108" y="86" width="16" height="42" fill="#D9C29A"/>
    <g stroke="#F7F1E4" stroke-width="1.1">
      <line x1="111" y1="86" x2="111" y2="94"/><line x1="114.5" y1="86" x2="114.5" y2="94"/><line x1="118" y1="86" x2="118" y2="94"/>
    </g>
    <line x1="110" y1="86.5" x2="119" y2="86.5" stroke="#F7F1E4" stroke-width="1"/>
    <circle cx="132" cy="96" r="4.2" fill="#E4C4A4"/>
    <path d="M126 102 h12 v12 h-4 l-1 10 h-3 l-1-10 h-3 z" fill="#1E4C8A"/>
    <rect x="136" y="78" width="5" height="26" rx="1" transform="rotate(18 138 90)" fill="#C6A15A"/>
    <circle cx="164" cy="68" r="3.4" fill="#C4372F"/>
    <path d="M150 74 q8 -10 16 -4" fill="none" stroke="#C4372F" stroke-width="1" opacity="0.7"/>
    <rect x="156" y="8" width="62" height="30" rx="2" fill="#141E2A"/>
    <text x="187" y="29" text-anchor="middle" font-family="Playfair Display, serif" font-size="18" fill="#F5F0E6">100</text>
  </svg>`;
}

function arrest() {
  return `<svg class="draw" viewBox="0 0 176 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="176" height="60" fill="#1A3048"/>
    <rect y="40" width="176" height="20" fill="#3A4034"/>
    <rect x="118" y="8" width="28" height="32" fill="#243044"/>
    <rect x="122" y="12" width="8" height="6" fill="#E7D7A2"/>
    <rect x="134" y="18" width="8" height="6" fill="#C9D7E4"/>
    <line x1="28" y1="40" x2="28" y2="14" stroke="#C9B48A" stroke-width="2"/>
    <circle cx="28" cy="12" r="5" fill="#F2C14B"/>
    <circle cx="28" cy="12" r="10" fill="#F2C14B" opacity="0.25"/>
    <circle cx="62" cy="28" r="5" fill="#E4C4A4"/>
    <path d="M56 34 h12 v10 h-3 l-1 8 h-4 l-1-8 h-3 z" fill="#1E3A5F"/>
    <path d="M54 40 h6" stroke="#1E3A5F" stroke-width="2"/>
    <circle cx="92" cy="30" r="5" fill="#E4C4A4"/>
    <path d="M86 36 h12 v9 h-12 z" fill="#6E4B32"/>
    <path d="M84 42 h16" stroke="#6E4B32" stroke-width="2"/>
    <circle cx="148" cy="22" r="7" fill="#8C3A2F"/>
    <path d="M148 16 l1.4 4.2 h4.4 l-3.6 2.6 1.4 4.2 -3.6-2.6 -3.6 2.6 1.4-4.2 -3.6-2.6 h4.4 z" fill="#F5F0E6"/>
  </svg>`;
}

function ship() {
  return `<svg class="draw" viewBox="0 0 176 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="176" height="60" fill="#102433"/>
    <path d="M0 40 Q30 34 60 40 T120 40 T176 40 V60 H0 Z" fill="#1A455C"/>
    <path d="M0 48 Q40 44 80 50 T176 46 V60 H0 Z" fill="#16384A"/>
    <path d="M38 40 L58 26 H124 L138 40 Z" fill="#6A5344"/>
    <rect x="70" y="16" width="22" height="12" fill="#4E4038"/>
    <rect x="92" y="12" width="6" height="16" fill="#2A2420"/>
    <path d="M78 16 C70 6 74 2 80 0 C78 8 84 8 82 16 Z" fill="#E36A2C"/>
    <path d="M96 14 C90 4 98 -2 104 2 C98 6 102 10 100 14 Z" fill="#F2C14B"/>
    <circle cx="84" cy="6" r="5" fill="#D9D3CB" opacity="0.55"/>
    <circle cx="98" cy="4" r="4" fill="#E7E2DA" opacity="0.4"/>
  </svg>`;
}

function tennis() {
  return `<svg class="draw" viewBox="0 0 176 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="176" height="60" fill="#245C38"/>
    <rect x="28" y="8" width="120" height="44" fill="#2F6B40" stroke="#F4EFE4" stroke-width="1.2"/>
    <line x1="88" y1="8" x2="88" y2="52" stroke="#F4EFE4" stroke-width="1.4"/>
    <line x1="28" y1="30" x2="148" y2="30" stroke="#F4EFE4" stroke-width="0.8"/>
    <line x1="88" y1="14" x2="88" y2="46" stroke="#F7F1E4" stroke-width="3"/>
    <circle cx="112" cy="22" r="3.2" fill="#E7F27A"/>
    <circle cx="58" cy="36" r="4" fill="#E4C4A4"/>
    <path d="M54 40 h8 v8 h-8 z" fill="#1E4C8A"/>
    <path d="M66 28 q10 6 6 16" fill="none" stroke="#F5F0E6" stroke-width="1.6"/>
    <ellipse cx="74" cy="24" rx="5" ry="7" fill="none" stroke="#F5F0E6" stroke-width="1.4"/>
  </svg>`;
}

function olympics() {
  const rings = [
    [58, 30, "#1D4E89"],
    [70, 30, "#1A1A1A"],
    [82, 30, "#C4372F"],
    [64, 36, "#C9A227"],
    [76, 36, "#2F6B40"],
  ];
  const ringSvg = rings
    .map(([x, y, fill]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="none" stroke="${fill}" stroke-width="1.6"/>`)
    .join("");
  return `<svg class="draw" viewBox="0 0 176 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="176" height="60" fill="#E7E1D4"/>
    <path d="M8 50 Q88 18 168 50 V60 H8 Z" fill="#2C4A3A"/>
    <path d="M28 50 Q88 30 148 50" fill="none" stroke="#F5F0E6" stroke-width="1" opacity="0.7"/>
    ${ringSvg}
    <text x="12" y="54" font-family="Playfair Display, serif" font-size="12" fill="#F7F3EA">1956</text>
    <text x="124" y="54" font-family="Playfair Display, serif" font-size="12" fill="#F7F3EA">2026</text>
  </svg>`;
}

function boat() {
  return `<svg class="draw" viewBox="0 0 176 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="176" height="60" fill="#8FB4CE"/>
    <path d="M0 34 Q22 28 44 34 T88 34 T132 34 T176 34 V60 H0 Z" fill="#3E7C9A"/>
    <path d="M0 46 Q30 40 60 48 T130 44 T176 48 V60 H0 Z" fill="#2C6484"/>
    <path d="M48 36 Q88 18 128 36 L118 42 Q88 28 58 42 Z" fill="#6E4B32"/>
    <path d="M70 30 Q88 22 106 30" fill="none" stroke="#3A2A22" stroke-width="1"/>
    <circle cx="40" cy="32" r="2.4" fill="#1C1915"/>
    <path d="M38 34 q4 6 0 8" fill="none" stroke="#1C1915" stroke-width="1.2"/>
  </svg>`;
}

function rugby() {
  return `<svg class="draw" viewBox="0 0 176 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="176" height="60" fill="#2F6B40"/>
    <path d="M0 46 Q40 40 80 48 T176 44 V60 H0 Z" fill="#245C34"/>
    <g stroke="#F5F0E6" stroke-width="2" fill="none">
      <path d="M40 44 V16"/><path d="M62 44 V16"/><path d="M40 16 H62"/>
    </g>
    <ellipse cx="118" cy="30" rx="16" ry="10" transform="rotate(-28 118 30)" fill="#F3EFE6" stroke="#1C1915" stroke-width="1.2"/>
    <path d="M108 34 Q118 28 128 26" fill="none" stroke="#1C1915" stroke-width="0.8"/>
  </svg>`;
}

function submarine() {
  return `<svg class="draw" viewBox="0 0 176 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="176" height="60" fill="#14384C"/>
    <path d="M0 18 Q40 14 80 18 T176 16" fill="none" stroke="#8FB4CE" stroke-width="1.2" opacity="0.7"/>
    <ellipse cx="96" cy="36" rx="52" ry="12" fill="#5E6A72"/>
    <rect x="78" y="20" width="22" height="10" rx="2" fill="#4C585F"/>
    <rect x="86" y="12" width="3" height="10" fill="#3E484E"/>
    <circle cx="70" cy="36" r="2" fill="#C5D5DE"/>
    <circle cx="84" cy="36" r="2" fill="#C5D5DE"/>
    <path d="M44 36 L36 42 H48 Z" fill="#3E484E"/>
    <path d="M148 34 L156 40 H144 Z" fill="#3E484E"/>
  </svg>`;
}

function hospital() {
  return `<svg class="draw" viewBox="0 0 176 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="176" height="60" fill="#E7F0F2"/>
    <rect x="18" y="28" width="86" height="16" rx="2" fill="#F7F4EE" stroke="#1C1915" stroke-width="1"/>
    <rect x="14" y="40" width="96" height="6" fill="#C9D3D6"/>
    <circle cx="40" cy="24" r="6" fill="#E4C4A4"/>
    <path d="M30 30 h22 v8 H30 z" fill="#D7E4EA"/>
    <rect x="118" y="10" width="42" height="28" rx="2" fill="#16384A"/>
    <polyline points="124,28 132,28 136,16 142,32 148,22 154,24" fill="none" stroke="#7DCEA0" stroke-width="1.4"/>
    <rect x="126" y="42" width="4" height="10" fill="#8AA0A6"/>
  </svg>`;
}

function protest() {
  return `<svg class="draw" viewBox="0 0 176 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="176" height="60" fill="#D5DDEA"/>
    <rect y="44" width="176" height="16" fill="#C4B8A4"/>
    <g fill="#1C1915">
      <circle cx="46" cy="30" r="4.5"/>
      <rect x="42" y="34" width="8" height="12"/>
      <circle cx="88" cy="28" r="4.5"/>
      <rect x="84" y="32" width="8" height="14"/>
      <circle cx="128" cy="30" r="4.5"/>
      <rect x="124" y="34" width="8" height="12"/>
    </g>
    <rect x="36" y="8" width="16" height="12" fill="#8C3A2F"/>
    <rect x="78" y="6" width="16" height="12" fill="#1E3A5F"/>
    <rect x="118" y="8" width="16" height="12" fill="#8A5A12"/>
    <line x1="44" y1="20" x2="44" y2="32" stroke="#6E4B32" stroke-width="1.3"/>
    <line x1="86" y1="18" x2="86" y2="30" stroke="#6E4B32" stroke-width="1.3"/>
    <line x1="126" y1="20" x2="126" y2="32" stroke="#6E4B32" stroke-width="1.3"/>
  </svg>`;
}

const DRAW = { cricket, arrest, ship, tennis, olympics, boat, rugby, submarine, hospital, protest };

function photoPos(story) {
  if (story.id === 1) return "center 40%";
  if (story.id === 4) return "center 22%";
  if (story.id === 6) return "center 42%";
  return "center";
}

function leadCard(story) {
  const chip = story.photo ? `<span class="chip">FILE PHOTO</span>` : "";
  const picture = story.photo
    ? `<img src="../${esc(story.photo)}" alt="${esc(story.credit)}" style="object-position:${photoPos(story)}">`
    : cricket();
  return `<article class="lead">
    <div class="art">${picture}${chip}</div>
    <p class="cred">${esc(story.credit)}</p>
    <p class="kick" style="color:${COLOR[story.region]}">${esc(story.kicker)}</p>
    <h2>${br(story.headline)}</h2>
    <p class="deck">${br(story.deck)}</p>
    <p class="src">${esc(story.source)} <span class="tag ${esc(story.certainty)}">${esc(story.certainty)}</span></p>
  </article>`;
}

function midCard(story) {
  const tag = `<span class="corner">${esc(story.certainty)}</span>`;
  const banner = story.photo
    ? `<div class="banner"><img src="../${esc(story.photo)}" alt="${esc(story.credit)}" style="object-position:${photoPos(story)}"><span class="chip">FILE PHOTO</span><span class="credline">${esc(story.credit)}</span>${tag}</div>`
    : `<div class="banner">${DRAW[story.art]()}${tag}</div>`;
  return `<article class="mid">${banner}<h3>${esc(story.headline)}</h3><p>${esc(story.deck)}</p></article>`;
}

const MW = 330;
const MH = 165;

function project(lon, lat) {
  return [((lon + 180) / 360) * MW, ((90 - lat) / 180) * MH];
}

const LAND = [
  [[-168, 71], [-166, 64], [-158, 58], [-153, 59], [-140, 69], [-128, 71], [-105, 72], [-94, 72], [-88, 76], [-80, 74], [-70, 68], [-64, 60], [-56, 53], [-56, 48], [-62, 47], [-70, 43], [-74, 40], [-76, 35], [-81, 32], [-82, 25], [-90, 29], [-94, 30], [-98, 26], [-97, 22], [-106, 22], [-110, 24], [-114, 28], [-117, 32], [-122, 34], [-124, 40], [-125, 49], [-130, 54], [-136, 58], [-152, 59], [-158, 61], [-166, 66], [-168, 71]],
  [[-68, 76], [-60, 75], [-52, 70], [-44, 68], [-42, 73], [-28, 73], [-22, 76], [-20, 81], [-40, 83], [-55, 82], [-68, 78]],
  [[-78, 8], [-70, 12], [-62, 10], [-52, 5], [-48, 0], [-36, -5], [-35, -8], [-38, -15], [-40, -22], [-48, -28], [-52, -32], [-62, -38], [-68, -46], [-74, -52], [-72, -46], [-74, -20], [-76, -14], [-78, -4], [-80, 0], [-78, 8]],
  [[-17, 15], [-16, 21], [-10, 32], [-6, 35], [-2, 35], [10, 37], [20, 32], [25, 32], [32, 31], [34, 28], [43, 12], [51, 12], [45, 2], [42, -1], [40, -15], [35, -20], [32, -26], [28, -34], [19, -35], [18, -32], [12, -18], [13, -6], [10, 2], [9, 4], [4, 5], [-5, 5], [-10, 6], [-15, 10], [-17, 14]],
  [[43, -12], [50, -16], [48, -25], [44, -25], [43, -16]],
  [[-10, 36], [-9, 43], [-8, 52], [-5, 58], [-2, 58], [2, 62], [5, 62], [8, 58], [6, 52], [2, 51], [0, 50], [-2, 48], [-1, 44], [3, 43], [8, 44], [12, 42], [16, 39], [20, 40], [26, 41], [28, 41], [36, 42], [40, 41], [50, 40], [54, 37], [60, 37], [68, 28], [72, 25], [78, 20], [80, 15], [77, 8], [80, 6], [98, 8], [104, 2], [109, -1], [114, -3], [119, 0], [122, 6], [120, 12], [122, 18], [122, 24], [120, 30], [122, 32], [128, 34], [132, 32], [140, 36], [145, 44], [142, 50], [138, 54], [132, 54], [128, 50], [120, 54], [115, 58], [112, 64], [104, 70], [90, 72], [70, 70], [60, 68], [44, 68], [30, 70], [20, 70], [12, 66], [14, 60], [20, 55], [26, 56], [28, 50], [24, 46], [20, 44], [16, 40], [12, 46], [8, 56], [5, 52], [2, 50], [-5, 48], [-9, 43], [-10, 36]],
  [[5, 58], [8, 63], [12, 66], [16, 69], [20, 70], [26, 71], [28, 70], [24, 64], [20, 60], [14, 58], [10, 58], [5, 62]],
  [[68, 24], [70, 20], [74, 14], [77, 8], [80, 10], [85, 16], [89, 22], [92, 24], [88, 26], [78, 25], [72, 25]],
  [[-8, 50], [-6, 58], [-2, 59], [2, 52], [-1, 50], [-5, 50]],
  [[8, 44], [10, 43], [12, 41], [15, 38], [16, 40], [13, 42], [12, 45], [9, 44]],
  [[130, 31], [134, 33], [138, 35], [141, 33], [140, 37], [141, 41], [145, 43], [142, 46], [139, 41], [137, 36], [132, 33]],
  [[113, -22], [122, -18], [128, -14], [136, -12], [142, -11], [146, -15], [150, -24], [153, -28], [150, -37], [146, -39], [140, -38], [136, -35], [128, -33], [124, -33], [116, -35], [114, -32], [113, -26]],
  [[146, -41], [148, -43], [147, -44], [145, -42]],
  [[166, -41], [168, -46], [170, -47], [172, -45], [174, -41], [172, -39], [169, -36], [166, -38], [166, -41]],
  [[174, -37], [176, -41], [178, -38], [176, -35], [174, -37]],
];

function mapSvg() {
  const land = LAND.map((ring) => {
    const d = ring.map(([lon, lat], i) => {
      const [x, y] = project(lon, lat);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z";
    return `<path d="${d}" fill="#E4D3B0"/>`;
  }).join("");
  const pins = data.stories.filter((story) => Number.isFinite(story.lat) && Number.isFinite(story.lon)).map((story) => {
    const [x, y] = project(story.lon, story.lat);
    const radius = story.tier === "lead" ? 3 : story.tier === "mid" ? 2.4 : 1.7;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${COLOR[story.region]}" stroke="#F7F3EA" stroke-width="0.6"/>`;
  }).join("");
  const labels = [
    [124, 30, "EUROPE"],
    [124, 40, "6–8 · 11"],
    [206, 40, "1 · 4"],
    [230, 70, "3"],
    [48, 64, "5"],
    [40, 46, "41"],
    [94, 36, "39"],
    [146, 104, "13"],
    [150, 78, "10"],
    [270, 124, "9 · 12"],
    [300, 112, "2"],
    [316, 42, "33"],
    [248, 90, "31"],
  ];
  const labelSvg = labels.map(([x, y, text]) =>
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="Source Sans Pro, Inter, sans-serif" font-size="8" fill="#1C1915" stroke="#F4EFE6" stroke-width="2" paint-order="stroke">${esc(text)}</text>`
  ).join("");
  return `<svg class="map" viewBox="0 0 ${MW} ${MH}" width="330" height="198" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="World map with story pins">
    <rect width="${MW}" height="${MH}" fill="#8FB4CE"/>
    ${land}${pins}${labelSvg}
  </svg>`;
}

function briefColumns() {
  const byRegion = {};
  for (const story of data.stories) {
    if (story.tier !== "brief") continue;
    (byRegion[story.region] ??= []).push(story);
  }
  return data.briefColumns.map((column) => {
    const blocks = column.map((code) => {
      const lines = (byRegion[code] ?? []).map((story) =>
        `<p class="br">${esc(story.brief)} <span class="tag ${esc(story.certainty)}">${esc(story.certainty)}</span></p>`
      ).join("");
      return `<h3 class="rh" style="color:${COLOR[code]}">${esc(data.regionNames[code])}</h3>${lines}`;
    }).join("");
    return `<div class="bcol">${blocks}</div>`;
  }).join("");
}

const leads = data.stories.filter((story) => story.tier === "lead").map(leadCard).join("");
const mids = data.stories.filter((story) => story.tier === "mid").map(midCard).join("");
const bar = data.regionOrder.map((code) =>
  `<div class="seg" style="background:${COLOR[code]}">${code} ${counts[code]}</div>`
).join("");
const ticks = data.zones.map((zone) =>
  `<div class="tick"><p class="when">${esc(zone.place)} ${esc(zone.time)}</p><p class="what">${esc(zone.label)}</p></div>`
).join("");
const dateCheck = esc(data.dateCheck).replace("DATE CHECK", "<strong>DATE CHECK</strong>");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(data.edition)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1024px; height: 1024px; background: #F5F0E6; }
  body {
    padding: 16px;
    display: grid;
    grid-template-rows: 14px 76px 17px 58px 22px 270px 240px 254px 29px 12px;
    color: #1C1915;
    font-family: "Source Sans Pro", Inter, sans-serif;
  }
  .kicker {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: end;
    font-size: 11px;
    line-height: 1.2;
    letter-spacing: 0.06em;
    font-weight: 700;
  }
  .kicker .right { text-align: right; }
  h1.date {
    font-family: "Playfair Display", Georgia, serif;
    font-size: 66px;
    line-height: 1.15;
    font-weight: 600;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
  .edition-deck {
    font-family: "Source Serif Pro", Georgia, serif;
    font-size: 13px;
    line-height: 1.3;
    color: #3A342C;
  }
  .zones { height: 58px; padding: 8px 0; text-align: center; }
  .zones .zt {
    font-size: 11px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
  .ticks { display: grid; grid-template-columns: repeat(6, 1fr); }
  .tick { text-align: center; }
  .tick .when { font-size: 11px; line-height: 1.15; font-weight: 700; }
  .tick .what { font-size: 10px; line-height: 1.3; color: #4E493F; }
  .bar { display: grid; grid-template-columns: repeat(8, 1fr); height: 22px; }
  .seg {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 6px;
    color: #F5F0E6;
    font-size: 11px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 0.03em;
  }
  .leads { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; height: 270px; }
  .lead {
    height: 270px;
    padding: 8px;
    background: #FBF7EF;
    outline: 1px solid #E4D9C6;
    outline-offset: -1px;
  }
  .art { position: relative; height: 140px; overflow: hidden; background: #D9D0C2; }
  .art img, .art svg { width: 100%; height: 140px; display: block; object-fit: cover; }
  .chip, .corner {
    position: absolute;
    top: 4px;
    background: #F5F0E6;
    font-size: 8px;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 1px 3px;
  }
  .chip { left: 4px; }
  .corner { right: 4px; }
  .cred { margin-top: 8px; font-size: 8px; line-height: 1.3; color: #5C564C; }
  .kick { font-size: 10px; line-height: 1.15; font-weight: 700; letter-spacing: 0.04em; }
  .lead h2 {
    font-family: "Playfair Display", Georgia, serif;
    font-size: 17px;
    line-height: 1.15;
    font-weight: 500;
  }
  .lead .deck {
    margin-top: 4px;
    font-family: "Source Serif Pro", Georgia, serif;
    font-size: 11px;
    line-height: 1.3;
    color: #3A342C;
  }
  .src { font-size: 9px; line-height: 1.3; color: #4E493F; }
  .tag { font-weight: 700; letter-spacing: 0.03em; margin-left: 4px; }
  .tag.OFFICIAL, .tag.OFF { color: #1F6B3A; }
  .tag.CONFIRMED, .tag.CONF { color: #1D4E89; }
  .tag.REPORTED, .tag.REP { color: #8A5A12; }
  .tag.CLAIM { color: #8E1B2C; }
  .mids { display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: 116px 116px; gap: 8px; height: 240px; }
  .mid {
    height: 116px;
    padding: 8px;
    background: #FBF7EF;
    outline: 1px solid #E4D9C6;
    outline-offset: -1px;
  }
  .banner { position: relative; height: 60px; overflow: hidden; background: #E7E0D2; }
  .banner img, .banner svg { width: 100%; height: 60px; display: block; object-fit: cover; }
  .credline {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    background: #F5F0E6;
    font-size: 8px;
    line-height: 1.2;
    letter-spacing: -0.03em;
    padding: 0 2px;
    white-space: nowrap;
    color: #3A342C;
  }
  .mid h3 {
    margin-top: 8px;
    font-family: "Source Serif Pro", Georgia, serif;
    font-size: 12px;
    line-height: 1.2;
    font-weight: 600;
  }
  .mid p {
    margin-top: 3px;
    font-family: "Source Sans Pro", Inter, sans-serif;
    font-size: 10px;
    line-height: 1.32;
    color: #3A342C;
  }
  .bottom {
    height: 254px;
    padding: 8px 0;
    display: grid;
    grid-template-columns: 330px 1fr;
    column-gap: 10px;
  }
  .mapwrap { height: 100%; display: flex; align-items: center; }
  .map { display: block; width: 330px; height: 198px; }
  .briefs { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 8px; }
  .rh { font-size: 10px; line-height: 1.15; font-weight: 700; letter-spacing: 0.04em; margin: 0 0 2px; text-align: left; }
  .bcol .rh:not(:first-child) { margin-top: 2px; }
  .br { font-size: 10px; line-height: 1.3; margin: 0 0 2px; text-align: left; }
  .datecheck {
    height: 29px;
    padding: 8px;
    background: #8E1B2C;
    color: #F5F0E6;
    font-size: 10px;
    line-height: 1.3;
  }
  .datecheck strong { font-weight: 700; letter-spacing: 0.04em; }
  .foot {
    height: 12px;
    font-size: 8px;
    line-height: 1.3;
    color: #5C564C;
    display: flex;
    align-items: center;
  }
</style>
</head>
<body>
  <header class="kicker"><span>${esc(data.kickerLeft)}</span><span class="right">${esc(data.kickerRight)}</span></header>
  <h1 class="date">${esc(data.edition)}</h1>
  <p class="edition-deck">${esc(data.deck)}</p>
  <section class="zones">
    <p class="zt">${esc(data.zonesTitle)} · ${esc(data.zonesNote)}</p>
    <div class="ticks">${ticks}</div>
  </section>
  <div class="bar">${bar}</div>
  <section class="leads">${leads}</section>
  <section class="mids">${mids}</section>
  <section class="bottom">
    <div class="mapwrap">${mapSvg()}</div>
    <div class="briefs">${briefColumns()}</div>
  </section>
  <p class="datecheck">${dateCheck}</p>
  <p class="foot">${esc(data.footer)}</p>
</body>
</html>
`;

const htmlPath = join(here, "poster.html");
const shotPath = join(here, "raw-shot.png");
await writeFile(htmlPath, html);

const chrome = spawnSync("google-chrome", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--allow-file-access-from-files",
  "--window-size=1024,1024",
  `--screenshot=${shotPath}`,
  `file://${htmlPath}`,
], { stdio: "inherit" });

if (chrome.status !== 0) {
  process.exit(chrome.status ?? 1);
}

const entryPath = join(root, "entry.png");
const previewPath = join(here, "preview-300.png");
const py = spawnSync("python3", ["-"], {
  input: `
from PIL import Image
from pathlib import Path
src, entry, preview = ${JSON.stringify(shotPath)}, ${JSON.stringify(entryPath)}, ${JSON.stringify(previewPath)}
im = Image.open(src).convert("RGB")
if im.size != (1024, 1024):
    if im.width >= 1024 and im.height >= 1024:
        im = im.crop((0, 0, 1024, 1024))
    else:
        canvas = Image.new("RGB", (1024, 1024), (245, 240, 230))
        canvas.paste(im, (0, 0))
        im = canvas
im.save(entry, "PNG", optimize=True)
size = Path(entry).stat().st_size
if size > 1048576:
    reduced = im.quantize(colors=128, method=Image.Quantize.MEDIANCUT).convert("RGB")
    reduced.save(entry, "PNG", optimize=True)
    size = Path(entry).stat().st_size
preview_im = im.resize((300, 300), Image.Resampling.LANCZOS)
preview_im.save(preview, "PNG", optimize=True)
print(f"{im.size[0]}x{im.size[1]} {size}")
`,
  encoding: "utf8",
});
if (py.status !== 0) {
  console.error(py.stderr);
  process.exit(py.status ?? 1);
}
await unlink(shotPath).catch(() => {});
console.log(py.stdout.trim());
console.log(entryPath);
