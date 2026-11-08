import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { scenarios, TEXT_SCORE_THRESHOLD } from "./scenarios.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const { PNG } = createRequire(path.join(here, "../../package.json"))("pngjs");

const [scenarioName, dir] = process.argv.slice(2);
const scenario = scenarios[scenarioName];
const scale = scenario.scale;
const read = (name) =>
  JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
const web = read("web-map.json");
const desktop = read("desktop-map.json");

const webPng = PNG.sync.read(fs.readFileSync(path.join(dir, "web.png")));
const desktopPng = PNG.sync.read(
  fs.readFileSync(path.join(dir, "desktop.png"))
);
const width = Math.min(webPng.width, desktopPng.width);
const height = Math.min(webPng.height, desktopPng.height);

const px = (value) => Math.round(value * scale);
const closeEnough = (a, b) =>
  a
    .slice(0, 3)
    .every((channel, i) => Math.round(channel) === Math.round(b[i])) &&
  Math.abs(a[3] - b[3]) < 0.01;
const sameColor = (a, b) =>
  a[3] === 0 && b[3] === 0 ? true : closeEnough(a, b);

const yiq = (r, g, b) => [
  r * 0.29889531 + g * 0.58662247 + b * 0.11448223,
  r * 0.59597799 - g * 0.2741761 - b * 0.32180189,
  r * 0.21147017 - g * 0.52261711 + b * 0.31114694
];
const delta = (a, b) => {
  const [y1, i1, q1] = yiq(a[0], a[1], a[2]);
  const [y2, i2, q2] = yiq(b[0], b[1], b[2]);
  return (
    0.5053 * (y1 - y2) ** 2 + 0.299 * (i1 - i2) ** 2 + 0.1957 * (q1 - q2) ** 2
  );
};
const maxDelta = 35215 * TEXT_SCORE_THRESHOLD ** 2;

function analyse(maskIds, maskRects, heatmapFile) {
  const ids = new Set(maskIds);
  const group = (elements) => {
    const map = new Map();
    for (const element of elements) {
      if (ids.has(element.id)) continue;
      if (!map.has(element.id)) map.set(element.id, []);
      map.get(element.id).push(element);
    }
    return map;
  };
  const webById = group(web.elements);
  const desktopById = group(desktop.elements);
  const missingOnDesktop = [];
  const extraOnDesktop = [];
  const geometry = [];
  const colors = [];
  const textStyle = [];
  let matched = 0;

  for (const [id, webElements] of webById) {
    const desktopElements = desktopById.get(id) ?? [];
    if (desktopElements.length < webElements.length)
      missingOnDesktop.push({
        id,
        web: webElements.length,
        desktop: desktopElements.length
      });
    if (desktopElements.length > webElements.length)
      extraOnDesktop.push({
        id,
        web: webElements.length,
        desktop: desktopElements.length
      });
    const count = Math.min(webElements.length, desktopElements.length);
    for (let index = 0; index < count; index++) {
      const w = webElements[index];
      const d = desktopElements[index];
      matched++;
      const deltas = {};
      for (const key of ["x", "y", "width", "height"])
        if (px(w[key]) !== px(d[key])) deltas[key] = px(d[key]) - px(w[key]);
      if (Object.keys(deltas).length)
        geometry.push({
          id,
          index,
          text: w.text,
          web: [w.x, w.y, w.width, w.height].map((v) => +v.toFixed(2)),
          desktop: [d.x, d.y, d.width, d.height].map((v) => +v.toFixed(2)),
          deltaDevicePx: deltas
        });
      const colorDiffs = {};
      if (!sameColor(w.background, d.background))
        colorDiffs.background = [w.background, d.background];
      if (d.color && !sameColor(w.color, d.color))
        colorDiffs.color = [w.color, d.color];
      if (
        d.borderColor &&
        w.borderWidth > 0 &&
        !sameColor(w.borderColor, d.borderColor)
      )
        colorDiffs.borderColor = [w.borderColor, d.borderColor];
      if (Object.keys(colorDiffs).length)
        colors.push({ id, index, ...colorDiffs });
      if (d.fontSize !== null) {
        const diffs = {};
        if (w.fontFamily !== d.fontFamily)
          diffs.fontFamily = [w.fontFamily, d.fontFamily];
        if (w.fontSize !== d.fontSize)
          diffs.fontSize = [w.fontSize, d.fontSize];
        if (w.fontWeight !== d.fontWeight)
          diffs.fontWeight = [w.fontWeight, d.fontWeight];
        if (
          w.lineHeight !== null &&
          d.lineHeight !== null &&
          Math.abs(w.lineHeight - d.lineHeight) > 0.01
        )
          diffs.lineHeight = [w.lineHeight, d.lineHeight];
        if (
          d.letterSpacing !== null &&
          Math.abs((w.letterSpacing ?? 0) - d.letterSpacing) > 0.01
        )
          diffs.letterSpacing = [w.letterSpacing, d.letterSpacing];
        if (Object.keys(diffs).length)
          textStyle.push({ id, index, text: w.text, ...diffs });
      }
    }
  }
  for (const [id, desktopElements] of desktopById)
    if (!webById.has(id))
      extraOnDesktop.push({ id, web: 0, desktop: desktopElements.length });

  const mask = new Uint8Array(width * height);
  const outside = new Uint8Array(width * height);
  const fill = (target, rect, pad) => {
    const x0 = Math.max(0, Math.floor(rect.x * scale) - pad);
    const y0 = Math.max(0, Math.floor(rect.y * scale) - pad);
    const x1 = Math.min(width, Math.ceil((rect.x + rect.width) * scale) + pad);
    const y1 = Math.min(
      height,
      Math.ceil((rect.y + rect.height) * scale) + pad
    );
    for (let y = y0; y < y1; y++)
      target.fill(1, y * width + x0, y * width + x1);
  };
  for (const rect of [...web.textRects, ...desktop.textRects])
    fill(mask, rect, 1);
  for (const rect of maskRects) fill(outside, rect, 0);

  const heat = new PNG({ width, height });
  let nonTextDiff = 0;
  let nonTextTotal = 0;
  let textPixels = 0;
  let textDiff = 0;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const o = y * width + x;
      const a = (y * webPng.width + x) * 4;
      const b = (y * desktopPng.width + x) * 4;
      const wp = webPng.data.subarray(a, a + 3);
      const dp = desktopPng.data.subarray(b, b + 3);
      const h = o * 4;
      const grey = Math.round((wp[0] + wp[1] + wp[2]) / 3 / 4 + 190);
      heat.data[h] = heat.data[h + 1] = heat.data[h + 2] = grey;
      heat.data[h + 3] = 255;
      if (outside[o]) {
        heat.data[h + 2] = Math.min(255, grey + 25);
        continue;
      }
      if (mask[o]) {
        textPixels++;
        if (delta(wp, dp) > maxDelta) {
          textDiff++;
          heat.data[h] = 40;
          heat.data[h + 1] = 90;
          heat.data[h + 2] = 255;
        }
      } else {
        nonTextTotal++;
        if (wp[0] !== dp[0] || wp[1] !== dp[1] || wp[2] !== dp[2]) {
          nonTextDiff++;
          heat.data[h] = 255;
          heat.data[h + 1] = 0;
          heat.data[h + 2] = 0;
        }
      }
    }
  fs.writeFileSync(path.join(dir, heatmapFile), PNG.sync.write(heat));

  return {
    summary: {
      elements: {
        web: web.elements.length,
        desktop: desktop.elements.length,
        matched,
        missingOnDesktop: missingOnDesktop.length,
        extraOnDesktop: extraOnDesktop.length
      },
      geometryMismatches: geometry.length,
      colorMismatches: colors.length,
      textStyleMismatches: textStyle.length,
      nonTextPixelsDifferent: nonTextDiff,
      nonTextPixelsTotal: nonTextTotal,
      textPixelsDifferent: textDiff,
      textPixelsTotal: textPixels,
      textScore: textPixels ? +(textDiff / textPixels).toFixed(4) : 0
    },
    missingOnDesktop,
    extraOnDesktop,
    geometry,
    colors,
    textStyle
  };
}

const mask = scenario.mask ?? { ids: [], rects: [] };
const unmasked = analyse([], [], "heatmap-unmasked.png");
const masked = analyse(mask.ids, mask.rects, "heatmap.png");

fs.writeFileSync(
  path.join(dir, "summary.json"),
  JSON.stringify(
    {
      scenario: scenarioName,
      scale,
      threshold: TEXT_SCORE_THRESHOLD,
      windowPixels: [width, height],
      mask: { reason: mask.reason, ids: mask.ids, rects: mask.rects },
      masked: masked.summary,
      unmasked: unmasked.summary,
      missingOnDesktop: masked.missingOnDesktop,
      extraOnDesktop: masked.extraOnDesktop,
      geometry: masked.geometry,
      colors: masked.colors,
      textStyle: masked.textStyle
    },
    null,
    1
  )
);

const line = (title, s) => [
  `### ${title}`,
  `- Elements: web ${s.elements.web}, desktop ${s.elements.desktop}, matched ${s.elements.matched}, ids missing on desktop ${s.elements.missingOnDesktop}, only on desktop ${s.elements.extraOnDesktop}`,
  `- Geometry mismatches (exact, device px): ${s.geometryMismatches}`,
  `- Colour mismatches (background, text, border): ${s.colorMismatches}`,
  `- Text style mismatches (family, size, weight, line height, letter spacing): ${s.textStyleMismatches}`,
  `- Non-text pixels different: ${s.nonTextPixelsDifferent} of ${s.nonTextPixelsTotal}`,
  `- Text pixels over threshold ${TEXT_SCORE_THRESHOLD}: ${s.textPixelsDifferent} of ${s.textPixelsTotal} (score ${s.textScore})`,
  ""
];
const lines = [
  `# Parity: ${scenarioName} (${path.basename(dir)})`,
  "",
  `Window ${width}x${height} device px, scale ${scale}. Mask: ${
    mask.reason ?? "none"
  }.`,
  "",
  ...line("Masked (the bar)", masked.summary),
  ...line("Unmasked (reference)", unmasked.summary),
  "## Ids missing on desktop (masked view)",
  ...masked.missingOnDesktop.map(
    (m) => `- ${m.id} (web ${m.web}, desktop ${m.desktop})`
  ),
  "",
  "## Ids only on desktop",
  ...masked.extraOnDesktop.map(
    (m) => `- ${m.id} (web ${m.web}, desktop ${m.desktop})`
  ),
  "",
  "## Geometry mismatches",
  ...masked.geometry
    .slice(0, 80)
    .map(
      (g) =>
        `- ${g.id}[${g.index}] web ${g.web.join(",")} desktop ${g.desktop.join(
          ","
        )} delta ${JSON.stringify(g.deltaDevicePx)}`
    ),
  "",
  "## Colour mismatches",
  ...masked.colors
    .slice(0, 40)
    .map((c) => `- ${c.id}[${c.index}] ${JSON.stringify(c)}`),
  "",
  "## Text style mismatches",
  ...masked.textStyle
    .slice(0, 40)
    .map((t) => `- ${t.id}[${t.index}] ${JSON.stringify(t)}`)
];
fs.writeFileSync(path.join(dir, "summary.md"), lines.join("\n") + "\n");
console.log(
  JSON.stringify(
    { masked: masked.summary, unmasked: unmasked.summary },
    null,
    1
  )
);
