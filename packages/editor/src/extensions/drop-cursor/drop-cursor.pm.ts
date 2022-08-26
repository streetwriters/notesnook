import { Plugin, EditorState } from "prosemirror-state";
import { dropPoint } from "prosemirror-transform";
import { EditorView } from "prosemirror-view";
import { DropcursorOptions } from "./drop-cursor";

type Handler = (e: Event) => void;
// :: (options: ?Object) → Plugin
// Create a plugin that, when added to a ProseMirror instance,
// causes a decoration to show up at the drop position when something
// is dragged over the editor.
//
// Nodes may add a `disableDropCursor` property to their spec to
// control the showing of a drop cursor inside them. This may be a
// boolean or a function, which will be called with a view and a
// position, and should return a boolean.
//
//   options::- These options are supported:
//
//     color:: ?string
//     The color of the cursor. Defaults to `black`.
//
//     width:: ?number
//     The precise width of the cursor in pixels. Defaults to 1.
//
//     class:: ?string
//     A CSS class name to add to the cursor element.
export function dropCursor(options: DropcursorOptions = {}) {
  return new Plugin({
    view(editorView) {
      return new DropCursorView(editorView, options);
    }
  });
}

class DropCursorView {
  editorView: EditorView;
  width: number;
  color: string;
  class: string;
  handlers: { name: string; handler: Handler }[];
  cursorPos: number | null;
  timeout: number | null;
  element: HTMLElement | null;

  constructor(editorView: EditorView, options: DropcursorOptions) {
    this.editorView = editorView;
    this.width = options.width || 1;
    this.color = options.color || "black";
    this.class = options.class || "";
    this.cursorPos = null;
    this.element = null;
    this.timeout = null;

    this.handlers = ["dragover", "dragend", "drop", "dragleave"].map((name) => {
      let handler: Handler = (e) => (<any>this)[name](e);
      editorView.dom.addEventListener(name, handler);
      return { name, handler };
    });
  }

  destroy() {
    this.handlers.forEach(({ name, handler }) =>
      this.editorView.dom.removeEventListener(name, handler)
    );
  }

  update(editorView: EditorView, prevState: EditorState) {
    if (this.cursorPos != null && prevState.doc != editorView.state.doc) {
      if (this.cursorPos > editorView.state.doc.content.size)
        this.setCursor(null);
      else this.updateOverlay();
    }
  }

  setCursor(pos: number | null) {
    if (pos == this.cursorPos) return;

    this.cursorPos = pos;
    if (pos == null && this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    } else {
      this.updateOverlay();
    }
  }

  updateOverlay() {
    if (!this.cursorPos) return;

    let $pos = this.editorView.state.doc.resolve(this.cursorPos),
      rect;
    if (!$pos.parent.inlineContent) {
      let before = $pos.nodeBefore,
        after = $pos.nodeAfter;
      if (before || after) {
        const node = this.editorView.nodeDOM(
          this.cursorPos - (before ? before.nodeSize : 0)
        ) as HTMLElement;
        if (!node) return;
        let nodeRect = node.getBoundingClientRect();

        let top = before ? nodeRect.bottom : nodeRect.top;
        if (before && after) {
          const cursor = this.editorView.nodeDOM(this.cursorPos) as HTMLElement;
          if (!cursor) return;
          top = (top + cursor.getBoundingClientRect().top) / 2;
        }
        rect = {
          left: nodeRect.left,
          right: nodeRect.right,
          top: top - this.width / 2,
          bottom: top + this.width / 2
        };
      }
    }
    if (!rect) {
      let coords = this.editorView.coordsAtPos(this.cursorPos);
      rect = {
        left: coords.left - this.width / 2,
        right: coords.left + this.width / 2,
        top: coords.top,
        bottom: coords.bottom
      };
    }

    let parent = (this.editorView.dom as HTMLElement).offsetParent;
    if (!this.element && parent) {
      this.element = parent.appendChild(document.createElement("div"));
      if (this.class) this.element.className = this.class;
      this.element.style.cssText =
        "position: absolute; z-index: 50; pointer-events: none; background-color: " +
        this.color;
    }
    let parentLeft, parentTop;
    if (
      !parent ||
      (parent == document.body && getComputedStyle(parent).position == "static")
    ) {
      parentLeft = -pageXOffset;
      parentTop = -pageYOffset;
    } else {
      let rect = parent.getBoundingClientRect();
      parentLeft = rect.left - parent.scrollLeft;
      parentTop = rect.top - parent.scrollTop;
    }

    if (!this.element) return;
    this.element.style.left = rect.left - parentLeft + "px";
    this.element.style.top = rect.top - parentTop + "px";
    this.element.style.width = rect.right - rect.left + "px";
    this.element.style.height = rect.bottom - rect.top + "px";
  }

  scheduleRemoval(timeout: number) {
    clearTimeout(this.timeout || undefined);
    this.timeout = (<unknown>(
      setTimeout(() => this.setCursor(null), timeout)
    )) as number;
  }

  dragover(event: DragEvent) {
    if (!this.editorView.editable) return;
    let pos = this.editorView.posAtCoords({
      left: event.clientX,
      top: event.clientY
    });

    let node =
      pos && pos.inside >= 0 && this.editorView.state.doc.nodeAt(pos.inside);
    let disableDropCursor = node && node.type.spec.disableDropCursor;
    let disabled =
      typeof disableDropCursor == "function"
        ? disableDropCursor(this.editorView, pos)
        : disableDropCursor;

    if (pos && !disabled) {
      let target = pos.pos;
      if (this.editorView.dragging && this.editorView.dragging.slice) {
        const point = dropPoint(
          this.editorView.state.doc,
          target,
          this.editorView.dragging.slice
        );
        if (!point) return this.setCursor(null);
        target = point;
      }
      this.setCursor(target);
      this.scheduleRemoval(5000);
    }
  }

  dragend() {
    this.scheduleRemoval(20);
  }

  drop() {
    this.scheduleRemoval(20);
  }

  dragleave(event: DragEvent) {
    if (
      event.target == this.editorView.dom ||
      !this.editorView.dom.contains(event.relatedTarget as Node)
    )
      this.setCursor(null);
  }
}
