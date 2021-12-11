import showdown from "showdown/dist/showdown";
import dataurl from "../utils/dataurl";
import { getDummyDocument, parseHTML } from "../utils/html-parser";

var converter = new showdown.Converter();
converter.setFlavor("original");

const splitter = /\W+/gm;
class Tiny {
  constructor(data) {
    this.data = data;
    this.text;
    this.document = parseHTML(data);
  }

  toHTML() {
    return this.data;
  }

  toTXT() {
    return this.document.body
      ? this.document.body.innerText || this.document.body.textContent
      : this.document.textContent;
  }

  toMD() {
    return converter.makeMarkdown(this.data, getDummyDocument());
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
    const attachmentElements = this.document.querySelectorAll("img");
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
    return this.document.outerHTML || this.document.body.innerHTML;
  }

  async extractAttachments(store) {
    const attachments = [];
    const attachmentElements = this.document.querySelectorAll("img,span");

    for (var i = 0; i < attachmentElements.length; ++i) {
      const attachment = attachmentElements[i];
      try {
        switch (attachment.tagName) {
          case "IMG": {
            if (!getDatasetAttribute(attachment, "hash")) {
              const src = attachment.getAttribute("src");
              if (!src) continue;

              const { data, mime } = dataurl.toObject(src);
              if (!data) continue;

              const type =
                getDatasetAttribute(attachment, "mime") || mime || "image/jpeg";

              const storeResult = await store(data, "base64");
              if (!storeResult) continue;

              const { key, metadata } = storeResult;
              if (!metadata.hash) continue;

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
      } catch (e) {
        if (e.message === "bad base-64") {
          attachment.remove();
          console.error(e);
          continue;
        }
        throw e;
      }
    }
    return {
      data: this.document.outerHTML || this.document.body.innerHTML,
      attachments,
    };
  }
}
export default Tiny;

function getHeadlineFromText(text) {
  for (var i = 0; i < text.length; ++i) {
    const char = text[i];
    if (char === "\n" || char === "\t" || char === "\r" || char === ".") {
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
