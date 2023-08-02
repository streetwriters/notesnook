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

import { Extension, TextSerializer } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { Fragment, Schema, Slice } from "prosemirror-model";
import { ListItem } from "../list-item";
import { LIST_NODE_TYPES } from "../../utils/node-types";
import { DOMSerializer } from "@tiptap/pm/model";

export class ClipboardDOMSerializer extends DOMSerializer {
  static fromSchema(schema: Schema): ClipboardDOMSerializer {
    return (
      schema.cached.domSerializer2 ||
      (schema.cached.domSerializer2 = new ClipboardDOMSerializer(
        this.nodesFromSchema(schema),
        this.marksFromSchema(schema)
      ))
    );
  }

  serializeFragment(
    fragment: Fragment,
    options?: { document?: Document | undefined } | undefined,
    target?: HTMLElement | DocumentFragment | undefined
  ): HTMLElement | DocumentFragment {
    const dom = super.serializeFragment(fragment, options, target);
    for (const p of dom.querySelectorAll("li > p")) {
      if (p.parentElement && p.parentElement.childElementCount > 1) continue;
      p.parentElement?.append(...p.childNodes);
      p.remove();
    }

    for (const p of dom.querySelectorAll('p[data-spacing="single"]')) {
      if (!p.previousElementSibling || p.previousElementSibling.tagName !== "P")
        continue;
      if (p.previousElementSibling.childNodes.length > 0)
        p.previousElementSibling.appendChild(document.createElement("br"));
      p.previousElementSibling.append(...p.childNodes);
      p.remove();
    }

    return dom;
  }
}

export const ClipboardTextSerializer = Extension.create({
  name: "clipboardTextSerializer",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("clipboardTextSerializer"),
        props: {
          transformCopied,
          clipboardSerializer: ClipboardDOMSerializer.fromSchema(
            this.editor.view.state.schema
          ),
          clipboardTextSerializer: (content, view) => {
            return getTextBetween(content, view.state.schema);
          }
        }
      })
    ];
  }
});

export function transformCopied(slice: Slice) {
  // when copying a single list item, we shouldn't retain the
  // list formatting but copy it as a paragraph.
  const maybeList = slice.content.firstChild;
  if (
    maybeList &&
    LIST_NODE_TYPES.includes(maybeList.type.name) &&
    maybeList.childCount === 1 &&
    maybeList.firstChild
  ) {
    return new Slice(maybeList.firstChild.content, 0, 0);
  }
  return slice;
}

export function getTextBetween(slice: Slice, schema: Schema): string {
  const range = { from: 0, to: slice.size };
  const separator = "\n";
  let text = "";
  let separated = true;

  slice.content.nodesBetween(0, slice.size, (node, pos, parent, index) => {
    const textSerializer = schema.nodes[node.type.name]?.spec
      .toText as TextSerializer;

    if (textSerializer) {
      if (node.isBlock && !separated) {
        text += separator;
        separated = true;
      }

      if (parent) {
        text += textSerializer({
          node,
          pos,
          parent,
          index,
          range
        });
      }
    } else if (node.isText) {
      text += node?.text;
      separated = false;
    } else if (node.isBlock && !!text) {
      // we don't want double spaced list items when pasting
      if (index === 0 && parent?.type.name === ListItem.name) return;

      text += separator;
      if (node.attrs.spacing === "double" && node.childCount > 0)
        text += separator;
      separated = true;
    }
  });

  return text;
}
