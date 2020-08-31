import { buildPage } from "../helper";
import HTMLTemplate from "./template";

function createMetaTag(name, content) {
  return `<meta name="nn-${name}" content="${content}">`;
}

function buildHTML(templateData) {
  return buildPage(HTMLTemplate, createMetaTag, templateData);
}

export default { buildHTML };
