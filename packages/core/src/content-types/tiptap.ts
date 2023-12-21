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
import { HTMLRewriter } from "../utils/html-rewriter";
import { HTMLParser } from "../utils/html-parser";
import {
  DomNode,
  FormatOptions,
  RecursiveCallback,
  convert
} from "html-to-text";
import { BlockTextBuilder } from "html-to-text/lib/block-text-builder";

export type ResolveHashes = (
  hashes: string[]
) => Promise<Record<string, string>>;

const ATTRIBUTES = {
  hash: "data-hash",
  mime: "data-mime",
  filename: "data-filename",
  src: "src"
};

(showdown.helper as any).document = getDummyDocument();
const converter = new showdown.Converter();
converter.setFlavor("original");

const splitter = /\W+/gm;
export class Tiptap {
  constructor(private readonly data: string) {}

  toHTML() {
    return this.data;
  }

  toTXT() {
    return convert(this.data, {
      wordwrap: 80,
      preserveNewlines: true,
      selectors: [
        { selector: "table", format: "dataTable" },
        { selector: "ul.checklist", format: "checkList" },
        { selector: "ul.simple-checklist", format: "checkList" },
        { selector: "p", format: "paragraph" }
      ],
      formatters: {
        checkList: (elem, walk, builder, formatOptions) => {
          return formatList(elem, walk, builder, formatOptions, (elem) => {
            return elem.attribs.class && elem.attribs.class.includes("checked")
              ? " ✅ "
              : " ☐ ";
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

  search(query: string) {
    const tokens = query.toLowerCase().split(splitter);
    const lowercase = this.toTXT().toLowerCase();
    return tokens.some((token) => lowercase.indexOf(token) > -1);
  }

  async insertMedia(resolve: ResolveHashes) {
    const hashes: string[] = [];
    new HTMLParser({
      ontag: (name, attr) => {
        const hash = attr[ATTRIBUTES.hash];
        if (name === "img" && hash) hashes.push(hash);
      }
    }).parse(this.data);
    if (!hashes.length) return this.data;

    const images = await resolve(hashes);
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
  removeAttachments(hashes: string[]) {
    return new HTMLRewriter({
      ontag: (_name, attr) => {
        if (hashes.includes(attr[ATTRIBUTES.hash])) return false;
      }
    }).transform(this.data);
  }

  async extractAttachments(
    store: (
      data: string,
      mime: string,
      filename?: string
    ) => Promise<string | undefined>
  ) {
    if (
      !this.data.includes(ATTRIBUTES.src) &&
      !this.data.includes(ATTRIBUTES.hash)
    )
      return {
        data: this.data,
        hashes: []
      };

    const sources: {
      src: string;
      filename?: string;
      mime?: string;
      id: string;
    }[] = [];
    new HTMLParser({
      ontag: (name, attr, pos) => {
        const hash = attr[ATTRIBUTES.hash];
        const src = attr[ATTRIBUTES.src];
        if (name === "img" && !hash && src) {
          sources.push({
            src,
            filename: attr[ATTRIBUTES.filename],
            mime: attr[ATTRIBUTES.mime],
            id: `${pos.start}${pos.end}`
          });
        }
      }
    }).parse(this.data);

    const images: Record<string, string | false> = {};
    for (const image of sources) {
      try {
        const { data, mimeType } = dataurl.toObject(image.src);
        if (!data || !mimeType) continue;
        const hash = await store(data, mimeType, image.filename);
        if (!hash) continue;

        images[image.id] = hash;
      } catch (e) {
        console.error(e);
        images[image.id] = false;
      }
    }

    const hashes: string[] = [];
    const html = new HTMLRewriter({
      ontag: (name, attr, pos) => {
        switch (name) {
          case "img": {
            const hash = attr[ATTRIBUTES.hash];

            if (hash) {
              hashes.push(hash);
              delete attr[ATTRIBUTES.src];
            } else {
              const hash = images[`${pos.start}${pos.end}`];
              if (!hash) return;

              hashes.push(hash);

              attr[ATTRIBUTES.hash] = hash;
              delete attr[ATTRIBUTES.src];
            }
            break;
          }
          case "iframe":
          case "span": {
            const hash = attr[ATTRIBUTES.hash];
            if (!hash) return;
            hashes.push(hash);
            break;
          }
        }
      }
    }).transform(this.data);

    return {
      data: html,
      hashes
    };
  }
}

function formatList(
  elem: DomNode,
  walk: RecursiveCallback,
  builder: BlockTextBuilder,
  formatOptions: FormatOptions,
  nextPrefixCallback: (elem: DomNode) => string
) {
  const isNestedList = elem?.parent?.name === "li";

  // With Roman numbers, index length is not as straightforward as with Arabic numbers or letters,
  // so the dumb length comparison is the most robust way to get the correct value.
  let maxPrefixLength = 0;
  const listItems = (elem.children || [])
    // it might be more accurate to check only for html spaces here, but no significant benefit
    .filter(
      (child) =>
        child.type !== "text" || (child.data && !/^\s*$/.test(child.data))
    )
    .map(function (child) {
      if (child.name !== "li") {
        return { node: child, prefix: "" };
      }
      const prefix = isNestedList
        ? nextPrefixCallback(child).trimStart()
        : nextPrefixCallback(child);
      if (prefix.length > maxPrefixLength) {
        maxPrefixLength = prefix.length;
      }
      return { node: child, prefix: prefix };
    });
  if (!listItems.length) {
    return;
  }

  builder.openList({
    interRowLineBreaks: 1,
    leadingLineBreaks: isNestedList ? 1 : formatOptions.leadingLineBreaks || 2,
    maxPrefixLength: maxPrefixLength,
    prefixAlign: "left"
  });

  for (const { node, prefix } of listItems) {
    builder.openListItem({ prefix: prefix });
    walk([node], builder);
    builder.closeListItem();
  }

  builder.closeList({
    trailingLineBreaks: isNestedList ? 1 : formatOptions.trailingLineBreaks || 2
  });
}
