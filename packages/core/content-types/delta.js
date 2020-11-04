import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import { deltaToMarkdown } from "quill-delta-to-markdown";

class Delta {
  constructor(data) {
    this.data = data;
    this._text = this.toTXT();
  }

  toHTML() {
    const deltaConverter = new QuillDeltaToHtmlConverter(this.data, {
      classPrefix: "nn",
      inlineStyles: true,
    });
    return deltaConverter.convert();
  }

  toTXT() {
    return this.data.reduce(function (text, op) {
      if (!op.insert) return text;
      if (typeof op.insert !== "string") return text + " ";
      return text + op.insert;
    }, "");
  }

  toMD() {
    return deltaToMarkdown(this.data);
  }

  toTitle() {
    return this._text.split(/\W+/).slice(0, 3).join(" ").trim();
  }

  toHeadline() {
    return this._text.split(" ").slice(0, 20).join(" ") + "...";
  }

  isEmpty() {
    return this._text.trim().length <= 0;
  }
}
export default Delta;
