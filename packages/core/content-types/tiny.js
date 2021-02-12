import TurndownService from "turndown";
var turndownService = new TurndownService();

const splitter = /\W+/gm;
var he;
class Tiny {
  constructor(data) {
    this.data = data;
  }

  toHTML() {
    return this.data;
  }

  toTXT() {
    if (window.DOMParser) {
      let doc = new DOMParser().parseFromString(this.data, "text/html");
      return doc.body.textContent || "";
    } else {
      if (!he) {
        he = require("he");
      }
      return he.decode(
        this.data.replace(/<br[^>]*>/gi, "\n").replace(/<[^>]+>/g, "")
      );
    }
  }

  toMD() {
    return turndownService.turndown(this.data);
  }

  toTitle() {
    return this.toTXT().substring(0, 30);
  }

  toHeadline() {
    return this.toTXT().substring(0, 80);
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
