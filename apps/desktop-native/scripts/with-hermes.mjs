import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const hermes = path.dirname(
  require.resolve("@react-native-gpui/hermes/package.json")
);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, [path.join(hermes, "scripts/fetch-binaries.mjs")]);

const [command, ...args] = process.argv.slice(2);
if (command) run(command, args);
