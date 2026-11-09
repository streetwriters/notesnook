import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const names = process.argv.slice(2);

function otherAppRunning() {
  return (
    spawnSync("pgrep", ["-f", "react-native-gpui--notesnook"]).status === 0
  );
}

async function waitForIdle() {
  while (otherAppRunning())
    await new Promise((resolve) => setTimeout(resolve, 5000));
}

const cleaner = path.join(here, "../../scripts/clean-build.mjs");
spawnSync("node", [cleaner, "--ensure", "25"], { stdio: "inherit" });
const failures = [];
for (const name of names)
  for (const scheme of ["light", "dark"]) {
    await waitForIdle();
    const result = spawnSync(
      "node",
      [path.join(here, "run.mjs"), name, scheme],
      { stdio: "ignore" }
    );
    console.log(`${name} ${scheme}: ${result.status === 0 ? "ok" : "FAILED"}`);
    if (result.status !== 0) failures.push(`${name} ${scheme}`);
  }
spawnSync("node", [cleaner], { stdio: "inherit" });
console.log(failures.length ? `failed: ${failures.join(", ")}` : "all ok");
fs.writeFileSync(
  path.join(here, "../../../../.local/parity/run-all.done"),
  new Date().toISOString()
);
