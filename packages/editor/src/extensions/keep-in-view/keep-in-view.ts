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
import { inlineDebounce } from "../../utils/debounce.js";

type KeepInViewOptions = {
  scrollIntoViewOnWindowResize: boolean;
};

export const KeepInView = Extension.create<
  KeepInViewOptions,
  {
    onWindowResize?: ((this: Window, ev: UIEvent) => void) | undefined;
  }
>({
  name: "keepinview",
  addOptions() {
    return {
      scrollIntoViewOnWindowResize: true
    };
  },

  addStorage() {
    return {
      onWindowResize: undefined
    };
  },

  onCreate() {
    if (!this.options.scrollIntoViewOnWindowResize) return;
    if (this.storage.onWindowResize) return;

    this.storage.onWindowResize = () => {
      keepLastLineInView(this.editor);
    };
    window.addEventListener("resize", this.storage.onWindowResize);
  },

  onDestroy() {
    if (!this.storage.onWindowResize) return;
    window.removeEventListener("resize", this.storage.onWindowResize);
    this.storage.onWindowResize = undefined;
  },
  onSelectionUpdate() {
    inlineDebounce(
      "keep_in_view",
      () => {
        keepLastLineInView(this.editor);
      },
      100
    );
  }
});

export function keepLastLineInView(
  editor: Editor,
  THRESHOLD = 80,
  SCROLL_THRESHOLD = 100
) {
  if (
    !editor.view ||
    editor.view.isDestroyed ||
    !editor.state.selection.empty ||
    !editor.isEditable
  )
    return;

  const isPopupVisible = document.querySelector(".editor-mobile-toolbar-popup");

  const node = editor.state.selection.$from;
  if (node.pos > editor.state.doc.nodeSize) return;

  const { top } = posToDOMRect(editor.view, node.pos, node.pos + 1);
  const isBelowThreshold =
    window.innerHeight - top < (isPopupVisible ? THRESHOLD + 60 : THRESHOLD);
  const isAboveThreshold = top < THRESHOLD;
  const DIFF_BOTTOM = THRESHOLD - (window.innerHeight - top);

  let DIFF_TOP = THRESHOLD - top;

  if (DIFF_TOP > 0) DIFF_TOP = DIFF_TOP * -1;

  if (isBelowThreshold || isAboveThreshold) {
    let { node: domNode } = editor.view.domAtPos(node.pos);
    if (domNode.nodeType === Node.TEXT_NODE && domNode.parentNode)
      domNode = domNode.parentNode;

    if (domNode instanceof HTMLElement) {
      const container = findScrollContainer(domNode);
      if (container) {
        container.scrollBy({
          top: isAboveThreshold
            ? DIFF_TOP + 10
            : DIFF_BOTTOM + (isPopupVisible ? 60 : 0),
          behavior: "smooth"
        });
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
