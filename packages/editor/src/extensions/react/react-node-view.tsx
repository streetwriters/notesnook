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

import React, { FunctionComponent, SyntheticEvent } from "react";
import { NodeView, Decoration, DecorationSource } from "prosemirror-view";
import { Node as PMNode, Slice } from "prosemirror-model";
import { NodeSelection } from "prosemirror-state";
import { PortalProviderAPI } from "./react-portal-provider.js";
import {
  ReactNodeViewProps,
  ReactNodeViewOptions,
  GetPosNode,
  ContentDOM
} from "./types.js";
import { Editor, NodeViewRendererProps } from "@tiptap/core";
import { __serializeForClipboard, EditorView } from "prosemirror-view";
import { EmotionThemeProvider } from "@notesnook/theme";
import { isAndroid, isiOS } from "../../utils/platform.js";
import { useToolbarStore } from "../../toolbar/stores/toolbar-store.js";

// This is hacky workaround to manually handle serialization when
// drag/dropping on mobile devices.
declare module "prosemirror-view" {
  export function __serializeForClipboard(
    view: EditorView,
    slice: Slice
  ): { dom: HTMLElement; text: string };
}
const portalProviderAPI = new PortalProviderAPI();
export class ReactNodeView<P extends ReactNodeViewProps> implements NodeView {
  private domRef!: HTMLElement;
  private contentDOMWrapper?: Node;

  contentDOM?: HTMLElement;
  node: PMNode;
  isDragging = false;
  selected = false;
  pos = -1;
  posEnd: number | undefined;

  constructor(
    node: PMNode,
    protected readonly editor: Editor,
    protected readonly getPos: GetPosNode,
    protected readonly options: ReactNodeViewOptions<P>
  ) {
    this.node = node;
    this.#updatePos();
  }

  deselectNode() {
    this.selected = false;
    this.render();
  }

  selectNode() {
    this.selected = true;
    this.render();
  }

  /**
   * This method exists to move initialization logic out of the constructor,
   * so object can be initialized properly before calling render first time.
   *
   * Example:
   * Instance properties get added to an object only after super call in
   * constructor, which leads to some methods being undefined during the
   * first render.
   */
  init() {
    this.domRef = this.createDomRef();
    this.domRef.ondragstart = (ev) => this.onDragStart(ev);

    const { dom: contentDOMWrapper, contentDOM } = this.getContentDOM() ?? {};

    if (this.domRef && contentDOMWrapper) {
      this.domRef.appendChild(contentDOMWrapper);
      this.contentDOM = contentDOM ? contentDOM : contentDOMWrapper;
      this.contentDOMWrapper = contentDOMWrapper || contentDOM;
    }

    // @see ED-3790
    // something gets messed up during mutation processing inside of a
    // nodeView if DOM structure has nested plain "div"s, it doesn't see the
    // difference between them and it kills the nodeView
    this.domRef.classList.add(`${this.node.type.name}-view-content-wrap`);
    this.render();

    return this;
  }

  private render() {
    if (process.env.NODE_ENV === "test") return;
    if (!this.domRef) {
      console.warn("Cannot render node view");
      return;
    }

    portalProviderAPI.render(this.Component, this.domRef);
  }

  createDomRef(): HTMLElement {
    if (this.options.wrapperFactory) return this.options.wrapperFactory();

    if (!this.node.isInline) {
      return document.createElement("div");
    }

    const htmlElement = document.createElement("span");
    return htmlElement;
  }

  getContentDOM(): ContentDOM {
    if (!this.options.contentDOMFactory) return;
    if (this.options.contentDOMFactory === true) {
      const content = document.createElement("div");
      content.classList.add(
        `${this.node.type.name.toLowerCase()}-content-wrapper`
      );
      content.style.whiteSpace = "inherit";
      // caret is not visible if content element width is 0px
      content.style.minWidth = "20px";
      return { dom: content };
    }
    return this.options.contentDOMFactory?.(this.node);
  }

  #updatePos() {
    this.pos = this.getPos();
    this.posEnd = this.pos + this.node.nodeSize;
  }

  handleRef = (node: HTMLElement | null) => this._handleRef(node);

  private _handleRef = (node: HTMLElement | null) => {
    const contentDOM = this.contentDOMWrapper || this.contentDOM;

    // move the contentDOM node inside the inner reference after rendering
    if (node && contentDOM && !node.contains(contentDOM)) {
      node.appendChild(contentDOM);
    }
  };

  Component: FunctionComponent = () => {
    if (!this.options.component) return null;
    return (
      <EmotionThemeProvider
        scope="editor"
        injectCssVars={false}
        theme={
          useToolbarStore.getState().isMobile
            ? { space: [0, 10, 12, 20] }
            : undefined
        }
      >
        <this.options.component
          {...(this.options.props as P)}
          pos={this.pos}
          editor={this.editor}
          getPos={this.getPos}
          node={this.node}
          forwardRef={this._handleRef}
          selected={this.selected}
          updateAttributes={(attr, options) =>
            this.updateAttributes(
              attr,
              this.getPos(),
              options?.addToHistory,
              options?.preventUpdate,
              options?.forceUpdate
            )
          }
        />
      </EmotionThemeProvider>
    );
  };

  updateAttributes(
    attributes: object,
    pos: number,
    addToHistory = false,
    preventUpdate = false,
    forceUpdate = false
  ) {
    this.editor.commands.command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...this.node.attrs,
        ...attributes
      });
      tr.setMeta("addToHistory", addToHistory);
      tr.setMeta("preventUpdate", preventUpdate);
      tr.setMeta("forceUpdate", forceUpdate);
      return true;
    });
  }

  update(
    node: PMNode,
    _decorations: readonly Decoration[],
    _innerDecorations: DecorationSource
    //  _innerDecorations?: Array<Decoration>,
    // validUpdate: (currentNode: PMNode, newNode: PMNode) => boolean = () => true
  ) {
    // @see https://github.com/ProseMirror/prosemirror/issues/648
    const isValidUpdate = this.node.type === node.type; // && validUpdate(this.node, node);
    if (!isValidUpdate) {
      return false;
    }

    // if (this.domRef && !this.node.sameMarkup(node)) {
    //   this.setDomAttrs(node, this.domRef);
    // }

    // View should not process a re-render if this is false.
    // We dont want to destroy the view, so we return true.
    if (!this.viewShouldUpdate(node)) {
      this.node = node;
      return true;
    }

    this.node = node;

    this.#updatePos();

    this.render();

    return true;
  }

  onDragStart(event: DragEvent) {
    const { view } = this.editor;
    const target = event.target as HTMLElement;

    const dragHandle = this.dom.querySelector("[data-drag-handle]");
    const dragImage = this.dom.querySelector("[data-drag-image]") || this.dom;

    if (!this.dom || this.contentDOM?.contains(target) || !dragHandle) return;

    // workaround to prevent opening of keyboard on drag start
    if (isAndroid || isiOS) {
      setTimeout(() => {
        (dragImage as HTMLElement).blur();
        document.body.focus();
        this.editor.commands.blur();
      });
    }

    // temporary border around the dragged element for better identification
    (dragImage as HTMLElement).style.border =
      "2px solid var(--paragraph, var(--nn_primary_paragraph))";
    setTimeout(function () {
      (dragImage as HTMLElement).style.border = "none";
    });

    let x = 0;
    let y = 0;

    // calculate offset for drag element if we use a different drag handle
    // element. Unfortunately, this has no effect on Android
    if (dragImage !== dragHandle) {
      const domBox = dragImage.getBoundingClientRect();
      const handleBox = dragHandle.getBoundingClientRect();

      // In React, we have to go through nativeEvent to reach offsetX/offsetY.
      const offsetX =
        event.offsetX ??
        (event as unknown as SyntheticEvent<HTMLElement, DragEvent>).nativeEvent
          ?.offsetX;
      const offsetY =
        event.offsetY ??
        (event as unknown as SyntheticEvent<HTMLElement, DragEvent>).nativeEvent
          ?.offsetY;

      x = handleBox.x - domBox.x + offsetX;
      y = handleBox.y - domBox.y + offsetY;
    }

    // we need to tell ProseMirror that we want to move the whole node
    // so we create a NodeSelection
    const selection = NodeSelection.create(view.state.doc, this.getPos());
    const transaction = view.state.tr.setSelection(selection);

    view.dispatch(transaction);

    forceHandleDrag(event, this.editor);
    event.dataTransfer?.setDragImage(dragImage, x, y);
  }

  stopEvent(event: Event): boolean {
    if (!this.dom) {
      return false;
    }

    // if (typeof this.options.stopEvent === 'function') {
    //   return this.options.stopEvent({ event })
    // }

    const target = event.target as HTMLElement;
    const isInElement =
      this.dom.contains(target) && !this.contentDOM?.contains(target);
    // any event from child nodes should be handled by ProseMirror
    if (!isInElement) {
      return false;
    }

    const isDropEvent = event.type === "drop";
    const isInput =
      ["INPUT", "BUTTON", "SELECT", "TEXTAREA"].includes(target.tagName) ||
      target.isContentEditable;

    // any input event within node views should be ignored by ProseMirror
    if (isInput && !isDropEvent) {
      return true;
    }

    // const { isEditable } = this.editor;
    // const { isDragging } = this;
    const isDraggable = !!this.node.type.spec.draggable;
    const isSelectable = NodeSelection.isSelectable(this.node);
    const isCopyEvent = event.type === "copy";
    const isPasteEvent = event.type === "paste";
    const isCutEvent = event.type === "cut";
    const isClickEvent = event.type === "mousedown";
    const isDragEvent = event.type.startsWith("drag");

    // ProseMirror tries to drag selectable nodes
    // even if `draggable` is set to `false`
    // this fix prevents that
    if (!isDraggable && isSelectable && isDragEvent) {
      event.preventDefault();
    }

    // if (isDraggable && isDragEvent && !isDragging) {
    //   event.preventDefault();
    //   return false;
    // }

    // // we have to store that dragging started
    // if (isDraggable && isEditable && !isDragging && isClickEvent) {
    //   const dragHandle = target.closest("[data-drag-handle]");
    //   const isValidDragHandle =
    //     dragHandle &&
    //     (this.dom === dragHandle || this.dom.contains(dragHandle));

    //   if (isValidDragHandle) {
    //     this.isDragging = true;

    //     document.addEventListener(
    //       "dragend",
    //       () => {
    //         this.isDragging = false;
    //       },
    //       { once: true }
    //     );

    //     document.addEventListener(
    //       "mouseup",
    //       () => {
    //         this.isDragging = false;
    //       },
    //       { once: true }
    //     );
    //   }
    // }

    // these events are handled by prosemirror
    if (
      // isDragging ||
      isDropEvent ||
      isCopyEvent ||
      isPasteEvent ||
      isCutEvent ||
      (isClickEvent && isSelectable)
    ) {
      return false;
    }

    return true;
  }

  ignoreMutation(
    mutation: MutationRecord | { type: "selection"; target: Element }
  ) {
    if (!this.dom || !this.contentDOM) {
      return true;
    }

    // TODO if (typeof this.options.ignoreMutation === 'function') {
    //   return this.options.ignoreMutation({ mutation })
    // }

    // a leaf/atom node is like a black box for ProseMirror
    // and should be fully handled by the node view
    if (this.node.isLeaf || this.node.isAtom) {
      return true;
    }

    // ProseMirror should handle any selections
    if (mutation.type === "selection") {
      return false;
    }

    // try to prevent a bug on mobiles that will break node views on enter
    // this is because ProseMirror can’t preventDispatch on enter
    // this will lead to a re-render of the node view on enter
    // see: https://github.com/ueberdosis/tiptap/issues/1214
    if (
      this.dom.contains(mutation.target) &&
      mutation.type === "childList" &&
      this.editor.isFocused
    ) {
      const changedNodes = [
        ...Array.from(mutation.addedNodes),
        ...Array.from(mutation.removedNodes)
      ] as HTMLElement[];

      // we’ll check if every changed node is contentEditable
      // to make sure it’s probably mutated by ProseMirror
      if (changedNodes.every((node) => node.isContentEditable)) {
        return false;
      }
    }

    // we will allow mutation contentDOM with attributes
    // so we can for example adding classes within our node view
    if (this.contentDOM === mutation.target && mutation.type === "attributes") {
      return true;
    }

    // ProseMirror should handle any changes within contentDOM
    if (this.contentDOM.contains(mutation.target)) {
      return false;
    }

    return true;
  }

  viewShouldUpdate(nextNode: PMNode): boolean {
    if (this.options.shouldUpdate)
      return this.options.shouldUpdate(this.node, nextNode);
    return true;
  }

  /**
   * Copies the attributes from a ProseMirror Node to a DOM node.
   * @param node The Prosemirror Node from which to source the attributes
   */
  setDomAttrs(node: PMNode, element: HTMLElement) {
    Object.keys(node.attrs || {}).forEach((attr) => {
      element.setAttribute(attr, node.attrs[attr]);
    });
  }

  get dom() {
    return this.domRef;
  }

  destroy() {
    portalProviderAPI.remove(this.domRef);
    this.domRef.remove();
  }
}

export function createNodeView<TProps extends ReactNodeViewProps>(
  component: React.ComponentType<TProps>,
  options?: Omit<ReactNodeViewOptions<TProps>, "component">
) {
  return ({ node, getPos, editor }: NodeViewRendererProps) => {
    const _getPos = () => (typeof getPos === "boolean" ? -1 : getPos());

    return new ReactNodeView<TProps>(node, editor as Editor, _getPos, {
      ...options,
      component
    }).init();
  };
}

function forceHandleDrag(event: DragEvent, editor: Editor) {
  if (!event.dataTransfer) return;
  const { view } = editor;
  const slice = view.state.selection.content();
  const { dom, text } = __serializeForClipboard(view, slice);

  event.dataTransfer.clearData();
  event.dataTransfer.setData("Text", text);
  event.dataTransfer.setData("text/plain", text);
  event.dataTransfer.setData("text/html", dom.innerHTML);
  event.dataTransfer.effectAllowed = "copyMove";

  view.dragging = { slice, move: true };

  // a small workaround to identity when a nodeView is being dragged
  if (isAndroid || isiOS) {
    (view.dragging as any).nodeView = true;
  }
}
