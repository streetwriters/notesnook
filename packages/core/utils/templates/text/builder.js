import { buildPage } from "../helper";
import TextTemplate from "./template";

function buildText(templateData) {
  return buildPage(TextTemplate, undefined, templateData);
}

export default { buildText };
