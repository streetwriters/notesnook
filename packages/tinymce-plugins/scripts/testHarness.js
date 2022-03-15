const fs = require("fs");
const { execSync, exec } = require("child_process");

const PLUGINS = ["codeblock"];
const COMMANDS = {
  build: (output, input) =>
    `esbuild --minify --bundle ${output} --platform=browser ${input}`,
  test: (input) => `npx playwright test ${input}`,
};

function build(pluginName) {
  const outputDir = `--outdir=./__tests__/host/dist/`;
  const input = `./${pluginName}/index.js`;
  const cmd = COMMANDS.build(outputDir, input);
  execSync(cmd, { encoding: "utf-8", stdio: "inherit" });
}

function prepare(pluginName) {
  const initFile = `./${pluginName}/__tests__/${pluginName}.init.js`;
  const outputInitFile = `--outfile=./__tests__/host/init.js`;
  const cmd = COMMANDS.build(outputInitFile, initFile);
  execSync(cmd, { encoding: "utf-8", stdio: "inherit" });
}

function test(pluginName) {
  const inputFile = `./${pluginName}/__tests__/`;
  const cmd = COMMANDS.test(inputFile);
  execSync(cmd, {
    encoding: "utf-8",
    stdio: "inherit",
    env: { ...process.env },
  });
}

function run() {
  for (let pluginName of PLUGINS) {
    build(pluginName);
    prepare(pluginName);
    test(pluginName);
  }
}

run();
