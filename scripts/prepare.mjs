import { execSync } from "child_process";
import { findPackages, readConfig, readJson } from "./utils.mjs";
import path from "path";
import { writeFile } from "fs/promises";

const config = readConfig();

const allPkgs = await findPackages(config.projects);
for (const pkg of allPkgs) {
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
    JSON.stringify(json, null, 2)
  );
}

execSync("bun link", { cwd: "./scripts" });
execSync("git config --local core.hooksPath .githooks/");
