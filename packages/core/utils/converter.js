import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import { deltaToMarkdown } from "quill-delta-to-markdown";
import HTMLBuilder from "./templates/html/builder";
import MarkdownBuilder from "./templates/markdown/builder";

function deltaToHTML(note, delta) {
  const deltaConverter = new QuillDeltaToHtmlConverter(delta.ops || delta, {
    classPrefix: "nn",
    inlineStyles: true,
  });

  return HTMLBuilder.buildHTML({
    metadata: note,
    title: note.title,
    content: deltaConverter.convert(),
    createdOn: note.dateCreated,
    editedOn: note.dateEdited,
  });
}

function deltaToMD(note, delta) {
  return MarkdownBuilder.buildMarkdown({
    metadata: note,
    title: note.title,
    content: deltaToMarkdown(delta.ops || delta),
    createdOn: note.dateCreated,
    editedOn: note.dateEdited,
  });
}

export default { deltaToHTML, deltaToMD };
