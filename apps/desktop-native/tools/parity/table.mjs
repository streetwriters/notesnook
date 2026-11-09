import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../../.local/parity");
const names = process.argv.slice(2);
const rows = [];
for (const name of names)
  for (const scheme of ["light", "dark"]) {
    const file = path.join(root, name, scheme, "summary.json");
    if (!fs.existsSync(file)) {
      rows.push(`| ${name} | ${scheme} | no data |  |  |  |  |  |  |`);
      continue;
    }
    const m = JSON.parse(fs.readFileSync(file, "utf8")).masked;
    rows.push(
      `| ${name} | ${scheme} | ${m.geometryMismatches} | ${
        m.colorMismatches
      } | ${m.textStyleMismatches} | ${m.unpairedText ?? "n/a"} | ${
        m.nonTextPixelsDifferent
      } / ${m.nonTextPixelsTotal} | ${m.textElementsOutside} of ${
        m.textElements
      } | ${m.textScore} |`
    );
  }
console.log(
  "| scenario | scheme | geometry | colour | text style | unpaired web text | non-text px | text outside rule | text score |\n|---|---|---|---|---|---|---|---|---|"
);
console.log(rows.join("\n"));
