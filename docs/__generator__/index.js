const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const generateRobot = require("./generateRobot");
const generateSitemap = require("./generateSitemap");
const { getDocsConfig, generateUrlsFromSidebarItems } = require("./utils");

function buildDocs() {
  const output = execSync("retype build", {
    cwd: "../",
    encoding: "utf-8",
  });

  return output;
}

function injectAnalytics(docsOutputPath) {
  const config = getDocsConfig(docsOutputPath);
  const urls = generateUrlsFromSidebarItems(config.sidebar, "", docsOutputPath);

  for (let url of urls) {
    const html = fs.readFileSync(url.outputFilePath, { encoding: "utf-8" });
    const dom = new JSDOM(html);
    dom.window.document.head.appendChild(
      createTrackerScript(dom.window.document)
    );

    fs.writeFileSync(
      url.outputFilePath,
      dom.window.document.documentElement.outerHTML
    );
  }
}

function createTrackerScript(document) {
  var script = document.createElement("script");
  script.src = "https://analytics.streetwriters.co/umami.js";
  script.async = true;
  script.dataset.websiteId = "ad34576b-2721-436c-b36a-47a614009d2b";
  script.dataset.domains = "docs.notesnook.com";
  script.dataset.autoTrack = "true";
  script.dataset.doNotTrack = "false";
  return script;
}

(function() {
  const output = buildDocs();
  console.log(output)
  if (!output.includes("0 errors")) {
    console.error(output);
    return;
  }
  console.log("Docs generated!");

  const outputPath = /OUTPUT: (.*$)/gm.exec(output)[1];

  console.log(`Documentation output path:`, outputPath);

  injectAnalytics(outputPath);

  console.log("Injected analytics script!");

  generateSitemap(outputPath);

  console.log("Sitemap generated!");

  generateRobot(outputPath);

  console.log("robot.txt generated!");
})();
