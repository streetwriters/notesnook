const fs = require("fs");
const { SitemapStream } = require("sitemap");
const { getDocsConfig, generateUrlsFromSidebarItems } = require("./utils");

function generateSitemap(docsOutputPath) {
  const config = getDocsConfig(docsOutputPath);

  const urls = generateUrlsFromSidebarItems(config.sidebar, "", docsOutputPath);

  // Creates a sitemap object given the input configuration with URLs
  const sitemap = new SitemapStream({ hostname: "https://docs.notesnook.com" });

  const writeStream = fs.createWriteStream(`${docsOutputPath}/sitemap.xml`);
  sitemap.pipe(writeStream);

  urls.forEach((url) => {
    const stat = fs.lstatSync(url.sourceFilePath);
    sitemap.write({
      url: url.path,
      lastmod: stat.mtime.toISOString(),
    });
  });

  sitemap.end();
}

module.exports = generateSitemap;
