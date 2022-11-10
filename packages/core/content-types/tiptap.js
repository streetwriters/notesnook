/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import showdown from "@streetwriters/showdown";
import dataurl from "../utils/dataurl";
import { getDummyDocument, parseHTML } from "../utils/html-parser";

showdown.helper.document = getDummyDocument();
var converter = new showdown.Converter();
converter.setFlavor("original");

const splitter = /\W+/gm;
export class Tiptap {
  constructor(data) {
    this.data = data;
    this.document = parseHTML(data);
  }

  toHTML() {
    return this.data;
  }

  toTXT() {
    return convert(this.data, {
      wordwrap: 80,
      preserveNewlines: true,
      selectors: [
        { selector: "table", format: "dataTable" },
        { selector: "ul.checklist", format: "taskList" }
      ],
      formatters: {
        taskList: (elem, walk, builder, formatOptions) => {
          return list(elem, walk, builder, formatOptions, (elem) => {
            return elem.attribs.class.includes("checked") ? " ✅ " : " ☐ ";
          });
        },
        paragraph: (elem, walk, builder, formatOptions) => {
          if (elem.parent && elem.parent.name === "li") {
            walk(elem.children, builder);
          } else {
            builder.openBlock({
              leadingLineBreaks: formatOptions.leadingLineBreaks || 2
            });
            walk(elem.children, builder);
            builder.closeBlock({
              trailingLineBreaks: formatOptions.trailingLineBreaks || 2
            });
          }
        }
      }
    });
  }

  toMD() {
    return converter.makeMarkdown(this.data);
  }

  toHeadline() {
    const paragraph = this.document.querySelector("p");
    if (!paragraph) return;

    return paragraph.innerText;
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
            current: i
          });
          if (!src) continue;
          attachment.setAttribute("src", src);
          break;
        }
      }
    }
    return this.document.body.innerHTML;
  }

  removeAttachments(hashes) {
    const query = hashes.map((h) => `[data-hash="${h}"]`).join(",");
    const attachmentElements = this.document.querySelectorAll(query);

    for (var i = 0; i < attachmentElements.length; ++i) {
      const attachment = attachmentElements[i];
      attachment.remove();
    }

    return this.document.body.innerHTML;
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
                key
              });
            } else {
              attachments.push({
                hash: getDatasetAttribute(attachment, "hash")
              });
            }
            attachment.removeAttribute("src");
            break;
          }
          default: {
            if (!getDatasetAttribute(attachment, "hash")) continue;
            attachments.push({
              hash: getDatasetAttribute(attachment, "hash")
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
      data: this.document.body.innerHTML,
      attachments
    };
  }
}

function getDatasetAttribute(element, attribute) {
  return element.getAttribute(`data-${attribute}`);
}

function setDatasetAttribute(element, attribute, value) {
  return element.setAttribute(`data-${attribute}`, value);
}
