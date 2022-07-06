import { Editor, Extension, posToDOMRect } from "@tiptap/core";

export const KeepInView = Extension.create({
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        setTimeout(() => {
          keepLastLineInView(editor);
        });
        return false;
      },
    };
  },
});

export function keepLastLineInView(editor: Editor) {
  const THRESHOLD = 100;

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
        container.scrollBy({ top: THRESHOLD, behavior: "smooth" });
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
    const { overflow } = parent.style;
    if (overflow.split(" ").every((o) => o === "auto" || o === "scroll")) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document.documentElement;
};
