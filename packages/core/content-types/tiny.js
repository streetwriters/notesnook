import showdown from "showdown";
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
    if (!("HTMLParser" in global)) return "";

    let doc = HTMLParser.createElement("div");
    doc.innerHTML = this.data;
    return doc.textContent.trim();
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
    if (!("HTMLParser" in global)) return;

    let doc = HTMLParser.createElement("div");
    doc.innerHTML = this.data;
    const attachmentElements = doc.querySelectorAll("img");

    for (var i = 0; i < attachmentElements.length; ++i) {
      const attachment = attachmentElements[i];
      switch (attachment.tagName) {
        case "IMG": {
          const hash = getDatasetAttribute(attachment, "hash");
          if (!hash) continue;

          const src = await getData(hash, {
            total: attachmentElements.length,
            current: i,
          });
          if (!src) continue;
          attachment.setAttribute("src", src);
          break;
        }
      }
    }
    return doc.innerHTML;
  }

  async extractAttachments(store) {
    if (!("HTMLParser" in global)) return;

    let doc = HTMLParser.createElement("div");
    doc.innerHTML = this.data;
    const attachmentElements = doc.querySelectorAll("img,.attachment");

    const attachments = [];
    for (var i = 0; i < attachmentElements.length; ++i) {
      const attachment = attachmentElements[i];
      switch (attachment.tagName) {
        case "IMG": {
          if (!getDatasetAttribute(attachment, "hash")) {
            const src = attachment.getAttribute("src");
            if (!src) continue;

            const { data, mime } = dataurl.toObject(src);
            if (!data) continue;

            const type =
              getDatasetAttribute(attachment, "mime") || mime || "image/jpeg";
            const { key, metadata } = await store(data, "base64");
            setDatasetAttribute(attachment, "hash", metadata.hash);

            attachments.push({
              type,
              filename:
                getDatasetAttribute(attachment, "filename") || metadata.hash,
              ...metadata,
              key,
            });
          } else {
            attachments.push({
              hash: getDatasetAttribute(attachment, "hash"),
            });
          }
          attachment.removeAttribute("src");
          break;
        }
        default: {
          if (!getDatasetAttribute(attachment, "hash")) continue;
          attachments.push({
            hash: getDatasetAttribute(attachment, "hash"),
          });
          break;
        }
      }
    }
    return { data: doc.innerHTML, attachments };
  }
}
export default Tiny;

function getDatasetAttribute(element, attribute) {
  return element.getAttribute(`data-${attribute}`);
}

function setDatasetAttribute(element, attribute, value) {
  return element.setAttribute(`data-${attribute}`, value);
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
