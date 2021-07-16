import showdown from "showdown";
import decode from "lean-he/decode";

var converter = new showdown.Converter();
converter.setFlavor("original");

const splitter = /\W+/gm;
class Tiny {
  constructor(data) {
    this.data = data;
    this.text;
  }

  toHTML() {
    return this.data;
  }

  toTXT() {
    if ("DOMParser" in window || "DOMParser" in global) {
      let doc = new DOMParser().parseFromString(this.data, "text/html");
      return doc.body.textContent.trim();
    } else {
      return decode(
        this.data.replace(/<br[^>]*>/gi, "\n").replace(/<[^>]+>/g, "")
      ).trim();
    }
  }

  toMD() {
    return converter.makeMarkdown(this.data);
  }

  toTitle() {
    if (!this.text) {
      this.text = this.toTXT();
    }
    return getTitleFromText(this.text);
  }

  toHeadline() {
    if (!this.text) {
      this.text = this.toTXT();
    }
    return getHeadlineFromText(this.text);
  }

  isEmpty() {
    return this.toTXT().trim().length <= 0;
  }

  /**
   * @returns {Boolean}
   */
  search(query) {
    const tokens = query.toLowerCase().split(splitter);
    const lowercase = this.toTXT().toLowerCase();
    return tokens.some((token) => lowercase.indexOf(token) > -1);
  }
}
export default Tiny;

function getHeadlineFromText(text) {
  for (var i = 0; i < text.length; ++i) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (
      char === "\n" ||
      char === "\t" ||
      char === "\r" ||
      (char === "." && nextChar === " ")
    ) {
      if (char === ".") ++i;
      return text.substring(0, i);
    }
  }
  return text;
}

function getTitleFromText(text) {
  var title = "";
  var count = 0;
  for (var i = 0; i < text.length; ++i) {
    const char = text[i];
    if (char === "\n" || char === "\t" || char === "\r" || char === " ") {
      ++count;
      title += " ";
      if (count === 4) {
        return title;
      }
    } else title += char;
  }
  return title;
}
