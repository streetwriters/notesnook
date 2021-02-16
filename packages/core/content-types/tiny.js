import TurndownService from "turndown";
import decode from "lean-he/decode";

var turndownService = new TurndownService();

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
    if (window.DOMParser) {
      let doc = new DOMParser().parseFromString(this.data, "text/html");
      return doc.body.textContent || "";
    } else {
      return decode(
        this.data.replace(/<br[^>]*>/gi, "\n").replace(/<[^>]+>/g, "")
      );
    }
  }

  toMD() {
    return turndownService.turndown(this.data);
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
    if (
      char === "\n" ||
      char === "\t" ||
      char === "\r" ||
      char === "." ||
      i >= 120
    ) {
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
