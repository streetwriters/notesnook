import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scenarios } from "./scenarios.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../../..");
const [scenarioName = "shell", onlyScheme] = process.argv.slice(2);
const scenario = scenarios[scenarioName];
const schemes = onlyScheme ? [onlyScheme] : scenario.schemes;
const seedFile = path.join(root, ".local/parity", scenarioName, "seed.json");
fs.mkdirSync(path.dirname(seedFile), { recursive: true });
fs.writeFileSync(seedFile, JSON.stringify(scenario.seed(Date.now())));

const run = (script, args) => {
  const result = spawnSync("node", [path.join(here, script), ...args], {
    stdio: ["ignore", "inherit", "inherit"]
  });
  if (result.status !== 0) throw new Error(`${script} failed`);
};

for (const scheme of schemes) {
  const dir = path.join(root, ".local/parity", scenarioName, scheme);
  fs.mkdirSync(dir, { recursive: true });
  run("capture-web.mjs", [scenarioName, scheme, dir, seedFile]);
  run("capture-desktop.mjs", [scenarioName, scheme, dir, seedFile]);
  run("diff.mjs", [scenarioName, dir]);
}
