import showdown from "showdown";
import { decode, DecodingMode, EntityLevel } from "entities";

var converter = new showdown.Converter();
converter.setFlavor("original");

const HASH_REGEX = /data-hash="(\S+)"/g;
const SRC_HASH_REGEX =
  /src="data:(image\/.+);base64,(\S+)"|data-hash="(\S+)"/gm;
const TAG_REGEX = /<(span|img)[^>]+/gm;

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
    return decode(
      this.data.replace(/<br[^>]*>/gi, "\n").replace(/<[^>]+>/g, ""),
      { level: EntityLevel.HTML, mode: DecodingMode.Strict }
    ).trim();
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

  async insertMedia(getData) {
    let document = this.data;

    const matches = Array.from(this.data.matchAll(TAG_REGEX));
    for (let i = 0; i < matches.length; ++i) {
      const match = matches[i];
      const nodeName = match[1];

      if (nodeName === "img") {
        const node = match[0];

        const hashMatch = node.match(HASH_REGEX);
        if (!hashMatch) continue;

        const [attribute, hash] = hashMatch;

        const src = await getData(hash, {
          total: matches.length,
          current: i,
        });
        if (!src) continue;

        const srcAttribute = createAttribute("src", src);
        const replacedNode = replaceAt(
          node,
          hashMatch.index,
          attribute,
          srcAttribute
        );
        document = replaceAt(this.data, match.index, node, replacedNode);
      }
    }
    return document;
  }

  extractAttachments() {
    const attachments = [];
    let document = this.data;

    for (let match of this.data.matchAll(TAG_REGEX)) {
      const nodeName = match[1];
      const node = match[0];
      const attachment = { hash: undefined, data: undefined, type: undefined };

      switch (nodeName) {
        case "img": {
          const replacedNode = node.replace(
            SRC_HASH_REGEX,
            (match, mime, data, hash) => {
              if (mime) attachment.type = mime;
              if (data) attachment.data = data;
              if (hash) attachment.hash = hash;
              return match.startsWith("src") ? "" : match;
            }
          );
          document = replaceAt(this.data, match.index, node, replacedNode);
          break;
        }
        case "span": {
          const matches = HASH_REGEX.exec(node);
          if (!matches) continue;
          const [_match, hash] = matches;
          attachments.push({ hash });
          break;
        }
      }
      if (attachment.hash || attachment.data) attachments.push(attachment);
    }

    return { data: document, attachments };
  }
}
export default Tiny;

function replaceAt(str, index, match, replacement) {
  let start = str.slice(0, index);
  start += replacement;
  start += str.slice(index + match.length);
  return start;
}

function createAttribute(key, value) {
  return `${key}="${value}"`;
}

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
