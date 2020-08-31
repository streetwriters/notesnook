import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import { deltaToMarkdown } from "quill-delta-to-markdown";
import HTMLBuilder from "./templates/html/builder";

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

function deltaToMD(delta) {
  return deltaToMarkdown(delta.ops || delta);
}

export default { deltaToHTML, deltaToMD };
