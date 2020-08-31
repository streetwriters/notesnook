import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import { deltaToMarkdown } from "quill-delta-to-markdown";

function deltaToHTML(delta) {
  const deltaConverter = new QuillDeltaToHtmlConverter(delta.ops || delta, {
    classPrefix: "nn",
    inlineStyles: true,
  });
  return deltaConverter.convert();
}

function deltaToMD(delta) {
  return deltaToMarkdown(delta.ops || delta);
}

export default { deltaToHTML, deltaToMD };
