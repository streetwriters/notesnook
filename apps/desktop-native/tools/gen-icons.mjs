import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const source = fs.readFileSync(
  path.join(root, "apps/web/src/components/icons/index.tsx"),
  "utf8"
);
const svgDir = path.join(root, "packages/icons/svgs");

const svgImports = new Map();
for (const match of source.matchAll(
  /import (\w+) from "@notesnook\/icons\/([\w-]+)\.svg\?react"/g
))
  svgImports.set(match[1], match[2]);

const exportsList = [];
for (const match of source.matchAll(
  /export const (\w+) = (createIcon|createSvgIcon)\(\s*(\w+)\s*(?:,\s*(true|false)\s*)?\)/g
))
  exportsList.push({
    name: match[1],
    kind: match[2],
    ref: match[3],
    rotate: match[4] === "true"
  });

const mdi = new Set();
const svgFiles = new Map();
const lines = [];
for (const entry of exportsList) {
  if (entry.kind === "createIcon") {
    mdi.add(entry.ref);
    lines.push(
      `export const ${entry.name} = mdiIcon(${entry.ref}${entry.rotate ? ", true" : ""});`
    );
  } else {
    const file = svgImports.get(entry.ref);
    if (!file) continue;
    svgFiles.set(file, entry.ref);
    lines.push(
      `export const ${entry.name} = svgIcon(svgs[${JSON.stringify(file)}]${entry.rotate ? ", true" : ""});`
    );
  }
}

const svgEntries = [...svgFiles.keys()].sort().map((file) => {
  const content = fs
    .readFileSync(path.join(svgDir, `${file}.svg`), "utf8")
    .replace(/\sstyle="[^"]*"/g, "")
    .replace(/\n/g, "");
  return `  ${JSON.stringify(file)}: ${JSON.stringify(content)}`;
});

const out = `import { mdiIcon, svgIcon } from "./icon-factory";
import {
${[...mdi].sort().map((name) => `  ${name}`).join(",\n")}
} from "@mdi/js";

const svgs: Record<string, string> = {
${svgEntries.join(",\n")}
};

${lines.join("\n")}
`;
fs.writeFileSync(
  path.join(here, "../src/app/components/icons.generated.ts"),
  out
);
console.log(`${lines.length} icons, ${svgFiles.size} svg files, ${mdi.size} mdi paths`);
