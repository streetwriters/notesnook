/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

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
import { extractFirstParagraph, getDummyDocument } from "../utils/html-parser";
import { HTMLParser, HTMLRewriter } from "../utils/html-rewriter";
import { convert } from "html-to-text";
import { list } from "html-to-text/lib/formatter";

const ATTRIBUTES = {
  hash: "data-hash",
  mime: "data-mime",
  filename: "data-filename",
  src: "src"
};

showdown.helper.document = getDummyDocument();
var converter = new showdown.Converter();
converter.setFlavor("original");

const splitter = /\W+/gm;
export class Tiptap {
  constructor(data) {
    this.data = data;
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
        paragraph: (elem, walk, builder) => {
          const { "data-spacing": dataSpacing } = elem.attribs;
          if (elem.parent && elem.parent.name === "li") {
            walk(elem.children, builder);
          } else {
            builder.openBlock({
              leadingLineBreaks: dataSpacing == "single" ? 1 : 2
            });
            walk(elem.children, builder);
            builder.closeBlock({
              trailingLineBreaks: 1
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
    return extractFirstParagraph(this.data);
  }

  // isEmpty() {
  //   return this.toTXT().trim().length <= 0;
  // }

  /**
   * @returns {Boolean}
   */
  search(query) {
    const tokens = query.toLowerCase().split(splitter);
    const lowercase = this.toTXT().toLowerCase();
    return tokens.some((token) => lowercase.indexOf(token) > -1);
  }

  async insertMedia(getData) {
    let hashes = [];
    new HTMLParser({
      ontag: (name, attr) => {
        const hash = attr[ATTRIBUTES.hash];
        if (name === "img" && hash) hashes.push(hash);
      }
    }).parse(this.data);

    const images = {};
    for (let i = 0; i < hashes.length; ++i) {
      const hash = hashes[i];
      const src = await getData(hash, {
        total: hashes.length,
        current: i
      });
      if (!src) continue;
      images[hash] = src;
    }

    return new HTMLRewriter({
      ontag: (name, attr) => {
        const hash = attr[ATTRIBUTES.hash];
        if (name === "img" && hash) {
          const src = images[hash];
          if (!src) return;
          attr[ATTRIBUTES.src] = src;
        }
      }
    }).transform(this.data);
  }

  /**
   * @param {string[]} hashes
   * @returns
   */
  removeAttachments(hashes) {
    return new HTMLRewriter({
      ontag: (_name, attr) => {
        if (hashes.includes(attr[ATTRIBUTES.hash])) return false;
      }
    }).transform(this.data);
  }

  async extractAttachments(store) {
    let sources = [];
    new HTMLParser({
      ontag: (name, attr, pos) => {
        const hash = attr[ATTRIBUTES.hash];
        const src = attr[ATTRIBUTES.src];
        if (name === "img" && !hash && src) {
          sources.push({
            src,
            id: `${pos.start}${pos.end}`
          });
        }
      }
    }).parse(this.data);

    const images = {};
    for (const image of sources) {
      try {
        const { data, mime } = dataurl.toObject(image.src);
        if (!data) continue;
        const storeResult = await store(data, mime);
        if (!storeResult) continue;

        images[image.id] = { ...storeResult, mime };
      } catch (e) {
        console.error(e);
        images[image.id] = false;
      }
    }

    let attachments = [];
    const html = new HTMLRewriter({
      ontag: (name, attr, pos) => {
        switch (name) {
          case "img": {
            const hash = attr[ATTRIBUTES.hash];

            if (hash) {
              attachments.push({
                hash
              });
              delete attr[ATTRIBUTES.src];
            } else {
              const imageData = images[`${pos.start}${pos.end}`];
              if (!imageData) return imageData;

              const { key, metadata, mime } = imageData;
              if (!metadata.hash) return;

              const type = attr[ATTRIBUTES.mime] || mime || "image/jpeg";
              const filename = attr[ATTRIBUTES.filename] || metadata.hash;

              attachments.push({
                type,
                filename,
                ...metadata,
                key
              });

              attr[ATTRIBUTES.hash] = metadata.hash;
              delete attr[ATTRIBUTES.src];
            }
            break;
          }
          case "iframe":
          case "span": {
            const hash = attr[ATTRIBUTES.hash];
            if (!hash) return;
            attachments.push({
              hash
            });
            break;
          }
        }
      }
    }).transform(this.data);

    return {
      data: html,
      attachments
    };
  }
}
