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

import { Editor, Extension, posToDOMRect } from "@tiptap/core";

type KeepInViewOptions = {
  scrollIntoViewOnWindowResize: boolean;
};

let onWindowResize: ((this: Window, ev: UIEvent) => void) | undefined =
  undefined;
export const KeepInView = Extension.create<KeepInViewOptions>({
  name: "keepinview",
  addOptions() {
    return {
      scrollIntoViewOnWindowResize: true
    };
  },
  onCreate() {
    if (!this.options.scrollIntoViewOnWindowResize) return;
    onWindowResize = () => {
      keepLastLineInView(this.editor);
    };
    window.addEventListener("resize", onWindowResize);
  },

  onDestroy() {
    if (!onWindowResize) return;
    window.removeEventListener("resize", onWindowResize);
    onWindowResize = undefined;
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        setTimeout(() => {
          keepLastLineInView(editor);
        });
        return false;
      }
    };
  }
});

export function keepLastLineInView(
  editor: Editor,
  THRESHOLD = 100,
  SCROLL_THRESHOLD = 100
) {
  const node = editor.state.selection.$from;
  const { top } = posToDOMRect(editor.view, node.pos, node.pos + 1);
  const isBelowThreshold = window.innerHeight - top < THRESHOLD;
  if (isBelowThreshold) {
    let { node: domNode } = editor.view.domAtPos(node.pos);
    if (domNode.nodeType === Node.TEXT_NODE && domNode.parentNode)
      domNode = domNode.parentNode;

    if (domNode instanceof HTMLElement) {
      const container = findScrollContainer(domNode);
      if (container) {
        container.scrollBy({ top: SCROLL_THRESHOLD, behavior: "smooth" });
      } else domNode.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

const findScrollContainer = (element: HTMLElement) => {
  if (!element) {
    return undefined;
  }

  let parent = element.parentElement;
  while (parent) {
    const { overflow, overflowY } = parent.style;
    if (isOverlow(overflow) || isOverlow(overflowY)) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document.documentElement;
};

function isOverlow(str: string) {
  return str.split(" ").every((o) => o === "auto" || o === "scroll");
}
