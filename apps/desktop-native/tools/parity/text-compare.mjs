import fs from "node:fs";
import path from "node:path";

const [, , ...dirs] = process.argv;
let mismatches = 0;
for (const dir of dirs) {
  const web = JSON.parse(
    fs.readFileSync(path.join(dir, "web-map.json"), "utf8")
  );
  const desktop = JSON.parse(
    fs.readFileSync(path.join(dir, "desktop-map.json"), "utf8")
  );
  const pool = [...(desktop.textNodes ?? [])];
  const lines = [];
  for (const w of web.textNodes ?? []) {
    let best = -1;
    let bestDistance = Infinity;
    pool.forEach((d, index) => {
      if (!d.text || !(w.text.startsWith(d.text) || d.text.startsWith(w.text)))
        return;
      const distance = Math.abs(d.x - w.x) + Math.abs(d.y - w.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    if (best < 0) {
      lines.push(
        `  missing on desktop: "${w.text}" web ${w.fontSize}/${w.fontWeight}`
      );
      continue;
    }
    const [d] = pool.splice(best, 1);
    const diffs = [];
    if (w.fontSize !== d.fontSize)
      diffs.push(`size ${w.fontSize} vs ${d.fontSize}`);
    if (w.fontWeight !== d.fontWeight)
      diffs.push(`weight ${w.fontWeight} vs ${d.fontWeight}`);
    if (w.fontFamily !== d.fontFamily)
      diffs.push(`family ${w.fontFamily} vs ${d.fontFamily}`);
    if (
      w.lineHeight !== null &&
      d.lineHeight !== null &&
      Math.abs(w.lineHeight - d.lineHeight) > 0.01
    )
      diffs.push(`lineHeight ${w.lineHeight} vs ${d.lineHeight}`);
    if (diffs.length) {
      mismatches++;
      lines.push(
        `  "${w.text}": ${diffs.join(", ")}\n     web chain: ${w.chain.join(
          " < "
        )}`
      );
    }
  }
  const inputPool = [...(desktop.inputs ?? [])];
  for (const w of web.inputs ?? []) {
    let best = -1;
    let bestDistance = Infinity;
    inputPool.forEach((d, index) => {
      const distance = Math.abs(d.x - w.x) + Math.abs(d.y - w.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    if (best < 0 || bestDistance > 40) {
      lines.push(`  input missing on desktop: "${w.text}" web ${w.fontSize}`);
      continue;
    }
    const [d] = inputPool.splice(best, 1);
    const diffs = [];
    if (w.fontSize !== d.fontSize)
      diffs.push(`size ${w.fontSize} vs ${d.fontSize}`);
    if (w.fontWeight !== d.fontWeight)
      diffs.push(`weight ${w.fontWeight} vs ${d.fontWeight}`);
    if (w.fontFamily !== d.fontFamily)
      diffs.push(`family ${w.fontFamily} vs ${d.fontFamily}`);
    if (diffs.length) {
      mismatches++;
      lines.push(
        `  input "${w.text}" (${w.isPlaceholder ? "placeholder" : "value"}${
          w.id ? " " + w.id : ""
        }): ${diffs.join(", ")}`
      );
    }
  }
  console.log(`${dir}: ${lines.length} differences`);
  for (const line of lines) console.log(line);
}
console.log(`text style mismatches: ${mismatches}`);
