const fs = require("fs");

function getDocsConfig(docsOutputPath) {
  const configFilePath = `${docsOutputPath}/resources/js/config.js`;
  const tempConfigFilePath = "./temp.config.js";
  fs.copyFileSync(configFilePath, tempConfigFilePath);

  fs.appendFileSync(
    tempConfigFilePath,
    "\n\nmodule.exports = { __DOCS_CONFIG__ };"
  );

  const js = require(tempConfigFilePath);

  const config = JSON.parse(JSON.stringify(js.__DOCS_CONFIG__));

  fs.rmSync(tempConfigFilePath);

  return config;
}

function generateUrlsFromSidebarItems(sidebarItems, base, outputDir) {
  const basePath = "..";
  const urls = [];
  for (let sidebarItem of sidebarItems) {
    let { n: path, i: children } = sidebarItem;
    path = base ? `${base}/${path}` : path;

    let sourceFilePath = basePath;
    let outputFilePath = outputDir;

    if (!!children) {
      urls.push(...generateUrlsFromSidebarItems(children, path, outputDir));
    } else {
      sourceFilePath += path.endsWith("/") ? path : `/${path}`;
      sourceFilePath += path.endsWith("/") ? "index.md" : `.md`;

      outputFilePath += path.endsWith("/") ? path : `/${path}`;
      outputFilePath += path.endsWith("/") ? "index.html" : `/index.html`;

      urls.push({
        path: path === "/" ? path : `/${path}/`,
        sourceFilePath,
        outputFilePath,
      });
    }
  }
  return urls;
}

module.exports = { getDocsConfig, generateUrlsFromSidebarItems };
