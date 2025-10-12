import { execSync } from "child_process";
import { allPackages, readJson } from "./utils.mjs";
import path from "path";
import { writeFile } from "fs/promises";

for (const pkg of allPackages) {
  execSync("bun link", { cwd: pkg });
  const json = readJson(path.join(pkg, "package.json"));
  for (const key of ["dependencies", "devDependencies"]) {
    for (const name in json[key]) {
      const version = json[key][name];
      if (!version.startsWith("file:")) continue;
      json[key][name] = `link:${name}`;
    }
  }
  await writeFile(
    path.join(pkg, "package.json"),
    JSON.stringify(json, null, 2) + "\n"
  );
}

execSync("bun link", { cwd: "./scripts" });
execSync("git config --local core.hooksPath .githooks/");
