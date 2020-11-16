import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";
import { deltaToMarkdown } from "quill-delta-to-markdown";

const splitter = /\W+/gm;
class Delta {
  constructor(data) {
    this.data = data;
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
    return getSubstringFromDelta(this.data, 30);
  }

  toHeadline() {
    return getSubstringFromDelta(this.data, 60);
  }

  isEmpty() {
    return this.toTXT().trim().length <= 0;
  }

  /**
   * @returns {Boolean}
   */
  search(query) {
    const tokens = query.split(splitter);
    return this.data.some((item) => {
      if (item.insert && item.insert.indexOf) {
        return tokens.some((token) => item.insert.indexOf(token) > -1);
      }
      return false;
    });
  }
}
export default Delta;

function getSubstringFromDelta(data, limit) {
  let substr = "";
  for (var i = 0; i < data.length; ++i) {
    const item = data[i];
    if (item.insert && typeof item.insert === "string")
      substr += item.insert.trim() + " ";
    if (substr.length >= limit) return substr.substring(0, limit).trim();
  }
  return substr.trim();
}
