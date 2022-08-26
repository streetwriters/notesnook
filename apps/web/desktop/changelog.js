const showdown = require("showdown");

var converter = new showdown.Converter();
converter.setFlavor("github");

module.exports.getChangelog = async function (tag) {
  try {
    if (!tag) return;

    const url = `https://api.github.com/repos/streetwriters/notesnook/releases/tags/v${tag}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return "No changelog found.";

    const release = await response.json();
    if (!release) return "No changelog found.";

    const { body } = release;

    const html = converter.makeHtml(body);
    return html;
  } catch {
    return "No changelog found.";
  }
};
