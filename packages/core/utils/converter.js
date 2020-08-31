import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import { deltaToMarkdown } from "quill-delta-to-markdown";

function makeHTMLDocument(title, html) {
  return `<!DOCTYPE html><html lang="en-US"><head><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1"><meta name="description" content="A safe place to write. Notesnook is the most secure, zero-knowledge and encrypted note-taking app all compiled into one simple to use package working on all major platforms."><meta name="note-title" content="${title}"><title>${title} - Notesnook</title></head><body>${html}</body></html>`;
}

function deltaToHTML(title, delta) {
  const deltaConverter = new QuillDeltaToHtmlConverter(delta.ops || delta, {
    classPrefix: "nn",
    inlineStyles: true,
  });
  return makeHTMLDocument(title, deltaConverter.convert());
}

function deltaToMD(delta) {
  return deltaToMarkdown(delta.ops || delta);
}

export default { deltaToHTML, deltaToMD };
