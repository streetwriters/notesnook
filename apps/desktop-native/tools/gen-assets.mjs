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
  "auth/capa-green",
  "featured/android-police",
  "featured/android-police-title",
  "featured/appleinsider",
  "featured/ness-labs",
  "featured/privacy-guides",
  "featured/privacy-guides-title",
  "featured/techlore",
  "featured/techlore-title",
  "featured/theverge",
  "featured/freedom-press",
  "featured/xda"
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

// Each asset under the name apps/web gives its import
// (`import AndroidPolice from "../../assets/featured/android-police.svg"`),
// as the `src` the kit's Image draws: a file shared with apps/web imports the
// same names from here.
const pascal = (file) =>
  file
    .split("/")
    .pop()
    .replace(/\.\w+$/, "")
    .replace(/(^|[-_])(\w)/g, (_, __, letter) => letter.toUpperCase());
const fileEntries = [
  ...svgFiles.map(
    (file) => `export const ${pascal(file)}: string = svgAssets[${JSON.stringify(file)}];`
  ),
  ...rasterFiles.map(
    (file) =>
      `export const ${pascal(file)}: string = rasterAssets[${JSON.stringify(file)}];`
  )
];
fs.writeFileSync(
  path.join(outDir, "files.generated.ts"),
  `${header}import { svgAssets } from "./svg.generated";\nimport { rasterAssets } from "./raster.generated";\n\n${fileEntries.join("\n")}\n`
);

console.log(`${svgFiles.length} svg assets, ${rasterFiles.length} raster assets`);
