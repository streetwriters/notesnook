import showdown from "showdown";
import { decode, DecodingMode, EntityLevel } from "entities";
import dataurl from "../utils/dataurl";
import { parseHTML } from "../utils/html-parser";

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
    const document = parseHTML(this.data);
    return document.textContent || document.body.textContent;
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
    let document = parseHTML(this.data);
    const attachmentElements = document.querySelectorAll("img");

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
    return document.outerHTML || document.body.innerHTML;
  }

  async extractAttachments(store) {
    const attachments = [];
    let document = parseHTML(this.data);

    const attachmentElements = document.querySelectorAll("img,span");

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
    return { data: document.outerHTML || document.body.innerHTML, attachments };
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

function getDatasetAttribute(element, attribute) {
  return element.getAttribute(`data-${attribute}`);
}

function setDatasetAttribute(element, attribute, value) {
  return element.setAttribute(`data-${attribute}`, value);
}
