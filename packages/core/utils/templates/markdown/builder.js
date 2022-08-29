import { buildPage } from "../helper";
import MDTemplate from "./template";

function createMetaTag(name, content) {
  if (!content || content.length <= 0) return "";
  return `[nn-${name}]:- "${content}"`;
}

function buildMarkdown(templateData) {
  return buildPage(MDTemplate, createMetaTag, templateData);
}

export default { buildMarkdown };
