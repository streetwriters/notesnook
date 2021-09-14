import showdown from "showdown";
import decode from "lean-he/decode";
import SparkMD5 from "spark-md5";
import dataurl from "../utils/dataurl";

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

  async insertAttachments(get) {
    if (!("DOMParser" in window || "DOMParser" in global)) return;

    let doc = new DOMParser().parseFromString(this.data, "text/html");
    const attachmentElements = doc.querySelectorAll("img");

    for (let attachment of attachmentElements) {
      switch (attachment.tagName) {
        case "IMG": {
          const hash = attachment.dataset["hash"];

          const attachmentItem = await get(hash);
          if (!attachmentItem) continue;

          attachment.setAttribute(
            "src",
            dataurl.fromObject({
              data: attachmentItem.data,
              type: attachmentItem.metadata.type,
            })
          );
          break;
        }
      }
    }
    return doc.body.innerHTML;
  }

  async extractAttachments(store) {
    if (!("DOMParser" in window || "DOMParser" in global)) return;

    let doc = new DOMParser().parseFromString(this.data, "text/html");
    const attachmentElements = doc.querySelectorAll("img,.attachment");

    const attachments = [];
    for (let attachment of attachmentElements) {
      switch (attachment.tagName) {
        case "IMG": {
          if (!attachment.dataset.hash) {
            const src = attachment.getAttribute("src");
            if (!src) continue;

            const { data, mime } = dataurl.toObject(src);
            if (!data) continue;

            const type = attachment.dataset.mime || mime || "image/jpeg";
            const metadata = await store(data, "base64");
            attachment.dataset.hash = metadata.hash;

            attachments.push({
              type,
              filename: attachment.dataset.filename,
              ...metadata,
            });
          } else {
            attachments.push({
              hash: attachment.dataset.hash,
            });
          }
          attachment.removeAttribute("src");
          break;
        }
        default: {
          if (!attachment.dataset.hash) return;
          attachments.push({
            hash: attachment.dataset.hash,
          });
          break;
        }
      }
    }
    return { data: doc.body.innerHTML, attachments };
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
