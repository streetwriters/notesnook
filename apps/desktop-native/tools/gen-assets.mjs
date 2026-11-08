import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const assetsDir = path.join(root, "apps/web/src/assets");
const outDir = path.join(here, "../src/app/assets");

const header = fs
  .readFileSync(path.join(here, "../src/app/components/icons.ts"), "utf8")
  .split("*/")[0]
  .concat("*/\n\n");

const svgFiles = [
  "star",
  "rocket",
  "mfa",
  "fallback2fa",
  "plans-footer",
  "accent",
  "backup",
  "cause",
  "e2e",
  "email",
  "export",
  "nomad",
  "note",
  "note2",
  "organize",
  "richtext",
  "sync",
  "vault",
  "workanywhere",
  "worklate",
  "auth/capa-green"
];

const svgEntries = svgFiles.map((file) => {
  const content = fs
    .readFileSync(path.join(assetsDir, `${file}.svg`), "utf8")
    .replace(/\sstyle="[^"]*"/g, "")
    .replace(/\n\s*/g, " ")
    .trim();
  return `  ${JSON.stringify(file)}: ${JSON.stringify(content)}`;
});

fs.writeFileSync(
  path.join(outDir, "svg.generated.ts"),
  `${header}export const svgAssets = {\n${svgEntries.join(",\n")}\n} as const;\n\nexport type SvgAssetName = keyof typeof svgAssets;\n`
);

const mime = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
const rasterFiles = [
  "notesnook-logo.png",
  "auth/notesnook-phone.png",
  "testimonials/cameron.jpg",
  "testimonials/holenstein.jpg",
  "testimonials/jason.jpg"
];
const rasterEntries = rasterFiles.map((file) => {
  const data = fs.readFileSync(path.join(assetsDir, file)).toString("base64");
  const ext = file.split(".").pop();
  return `  ${JSON.stringify(file)}: ${JSON.stringify(
    `data:${mime[ext]};base64,${data}`
  )}`;
});

fs.writeFileSync(
  path.join(outDir, "raster.generated.ts"),
  `${header}export const rasterAssets = {\n${rasterEntries.join(",\n")}\n} as const;\n\nexport type RasterAssetName = keyof typeof rasterAssets;\n`
);

console.log(`${svgFiles.length} svg assets, ${rasterFiles.length} raster assets`);
