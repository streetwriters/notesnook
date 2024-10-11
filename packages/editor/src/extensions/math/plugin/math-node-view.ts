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

/*---------------------------------------------------------
 *  Author: Benjamin R. Bray
 *  License: MIT (see LICENSE in project root for details)
 *--------------------------------------------------------*/

// prosemirror imports
import { Node as ProseNode, Fragment } from "prosemirror-model";
import {
  EditorState,
  Transaction,
  TextSelection,
  PluginKey
} from "prosemirror-state";
import {
  NodeView,
  EditorView,
  Decoration,
  DecorationSource
} from "prosemirror-view";
import { StepMap } from "prosemirror-transform";
import { keymap } from "prosemirror-keymap";
import {
  newlineInCode,
  chainCommands,
  deleteSelection
} from "prosemirror-commands";

import { collapseMathNode } from "./commands/collapse-math-node.js";
import { IMathPluginState } from "./math-plugin.js";
import { MathRenderFn } from "./renderers/types.js";

type FragmentWithContent = Fragment & { content: ProseNode[] };

//// INLINE MATH NODEVIEW //////////////////////////////////
export interface ICursorPosObserver {
  /** indicates on which side cursor should appear when this node is selected */
  cursorSide: "start" | "end";
  /**  */
  updateCursorPos(state: EditorState): void;
}

interface IMathViewOptions {
  /** Dom element name to use for this NodeView */
  tagName?: string;

  /** Used to render the Tex input */
  renderer: MathRenderFn;

  /** Should be true if node is inline */
  className?: string;
}

export class MathView implements NodeView, ICursorPosObserver {
  // nodeview params
  private _node: ProseNode;
  private _outerView: EditorView;
  private _getPos: () => number;

  // nodeview dom
  dom: HTMLElement;
  private _mathRenderElt: HTMLElement | undefined;
  private _mathSrcElt: HTMLElement | undefined;
  private _innerView: EditorView | undefined;

  // internal state
  cursorSide: "start" | "end";
  private _tagName: string;
  private _isEditing: boolean;
  private _mathPluginKey: PluginKey<IMathPluginState>;
  private options: IMathViewOptions;

  // == Lifecycle ===================================== //

  /**
   * @param onDestroy Callback for when this NodeView is destroyed.
   *     This NodeView should unregister itself from the list of ICursorPosObservers.
   *
   * Math Views support the following options:
   * @option displayMode If TRUE, will render math in display mode, otherwise in inline mode.
   * @option tagName HTML tag name to use for this NodeView.  If none is provided,
   *     will use the node name with underscores converted to hyphens.
   */
  constructor(
    node: ProseNode,
    view: EditorView,
    getPos: () => number,
    options: IMathViewOptions,
    mathPluginKey: PluginKey<IMathPluginState>
  ) {
    // store arguments
    this.options = options;
    this._node = node;
    this._outerView = view;
    this._getPos = getPos;
    this._mathPluginKey = mathPluginKey;

    // editing state
    this.cursorSide = "start";
    this._isEditing = false;

    // options
    this._tagName = options.tagName || this._node.type.name.replace("_", "-");

    // create dom representation of nodeview
    this.dom = document.createElement(this._tagName);
    if (options.className) this.dom.classList.add(options.className);
    this.dom.classList.add("math-node");

    this._mathRenderElt = document.createElement("span");
    this._mathRenderElt.textContent = "";
    this._mathRenderElt.classList.add("math-render");
    this.dom.appendChild(this._mathRenderElt);

    this._mathSrcElt = document.createElement("span");
    this._mathSrcElt.classList.add("math-src");
    this.dom.appendChild(this._mathSrcElt);

    // ensure
    this.dom.addEventListener("click", () => this.ensureFocus());

    // render initial content
    this.renderMath();
  }

  destroy() {
    // close the inner editor without rendering
    this.closeEditor(false);

    // clean up dom elements
    if (this._mathRenderElt) {
      this._mathRenderElt.remove();
      delete this._mathRenderElt;
    }
    if (this._mathSrcElt) {
      this._mathSrcElt.remove();
      delete this._mathSrcElt;
    }

    this.dom.remove();
  }

  /**
   * Ensure focus on the inner editor whenever this node has focus.
   * This helps to prevent accidental deletions of math blocks.
   */
  ensureFocus() {
    if (this._innerView && this._outerView.hasFocus()) {
      this._innerView.focus();
    }
  }

  // == Updates ======================================= //

  update(
    node: ProseNode,
    _decorations: readonly Decoration[],
    _innerDecorations: DecorationSource
  ) {
    if (!node.sameMarkup(this._node)) return false;
    this._node = node;

    if (this._innerView) {
      const state = this._innerView.state;

      const start = node.content.findDiffStart(state.doc.content);
      if (start != null) {
        const diff = node.content.findDiffEnd(state.doc.content);
        if (diff) {
          let { a: endA, b: endB } = diff;
          const overlap = start - Math.min(endA, endB);
          if (overlap > 0) {
            endA += overlap;
            endB += overlap;
          }
          this._innerView.dispatch(
            state.tr
              .replace(start, endB, node.slice(start, endA))
              .setMeta("fromOutside", true)
          );
        }
      }
    }

    if (!this._isEditing) {
      this.renderMath();
    }

    return true;
  }

  updateCursorPos(state: EditorState): void {
    const pos = this._getPos();
    const size = this._node.nodeSize;
    const inPmSelection =
      state.selection.from < pos + size && pos < state.selection.to;

    if (!inPmSelection) {
      this.cursorSide = pos < state.selection.from ? "end" : "start";
    }
  }

  // == Events ===================================== //

  selectNode() {
    if (!this._outerView.editable) {
      return;
    }
    this.dom.classList.add("ProseMirror-selectednode");
    if (!this._isEditing) {
      this.openEditor();
    }
  }

  deselectNode() {
    this.dom.classList.remove("ProseMirror-selectednode");
    if (this._isEditing) {
      this.closeEditor();
    }
  }

  stopEvent(event: Event): boolean {
    return (
      this._innerView !== undefined &&
      event.target !== undefined &&
      this._innerView.dom.contains(event.target as Node)
    );
  }

  ignoreMutation() {
    return true;
  }

  // == Rendering ===================================== //

  renderMath() {
    if (!this._mathRenderElt) {
      return;
    }

    // get tex string to render
    const content = (this._node.content as FragmentWithContent).content;
    let texString = "";
    if (content.length > 0 && content[0].textContent !== null) {
      texString = content[0].textContent.trim();
    }

    // empty math?
    if (texString.length < 1) {
      this.dom.classList.add("empty-math");
      // clear rendered math, since this node is in an invalid state
      while (this._mathRenderElt.firstChild) {
        this._mathRenderElt.firstChild.remove();
      }
      // do not render empty math
      return;
    } else {
      this.dom.classList.remove("empty-math");
    }

    // render katex, but fail gracefully
    try {
      this.options.renderer(texString, this._mathRenderElt);
      this._mathRenderElt.classList.remove("parse-error");
      this.dom.setAttribute("title", "");
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        this._mathRenderElt.classList.add("parse-error");
        this.dom.setAttribute("title", err.toString());
      }
    }
  }

  // == Inner Editor ================================== //

  dispatchInner(tr: Transaction) {
    if (!this._innerView) {
      return;
    }
    const { state, transactions } = this._innerView.state.applyTransaction(tr);
    this._innerView.updateState(state);

    if (!tr.getMeta("fromOutside")) {
      const outerTr = this._outerView.state.tr,
        offsetMap = StepMap.offset(this._getPos() + 1);
      for (let i = 0; i < transactions.length; i++) {
        const steps = transactions[i].steps;
        for (let j = 0; j < steps.length; j++) {
          const mapped = steps[j].map(offsetMap);
          if (!mapped) {
            throw Error("step discarded!");
          }
          outerTr.step(mapped);
        }
      }
      if (outerTr.docChanged) this._outerView.dispatch(outerTr);
    }
  }

  openEditor() {
    if (this._innerView) {
      throw Error("inner view should not exist!");
    }
    if (!this._mathSrcElt) throw new Error("_mathSrcElt does not exist!");

    // create a nested ProseMirror view
    this._innerView = new EditorView(this._mathSrcElt, {
      state: EditorState.create({
        doc: this._node,
        plugins: [
          keymap({
            Tab: (state, dispatch) => {
              if (dispatch) {
                dispatch(state.tr.insertText("\t"));
              }
              return true;
            },
            Backspace: chainCommands(deleteSelection, (state) => {
              // default backspace behavior for non-empty selections
              if (!state.selection.empty) {
                return false;
              }
              // default backspace behavior when math node is non-empty
              if (this._node.textContent.length > 0) {
                return false;
              }
              // otherwise, we want to delete the empty math node and focus the outer view
              this._outerView.dispatch(this._outerView.state.tr.insertText(""));
              this._outerView.focus();
              return true;
            }),
            // "Ctrl-Backspace": (state, dispatch, tr_inner) => {
            //   // delete math node and focus the outer view
            //   this._outerView.dispatch(this._outerView.state.tr.insertText(""));
            //   this._outerView.focus();
            //   return true;
            // },
            Enter: chainCommands(
              newlineInCode,
              collapseMathNode(this._outerView, +1, false)
            ),
            "Ctrl-Enter": collapseMathNode(this._outerView, +1, false),
            ArrowLeft: collapseMathNode(this._outerView, -1, true),
            ArrowRight: collapseMathNode(this._outerView, +1, true),
            ArrowUp: collapseMathNode(this._outerView, -1, true),
            ArrowDown: collapseMathNode(this._outerView, +1, true)
          })
        ]
      }),
      dispatchTransaction: this.dispatchInner.bind(this)
    });

    // focus element
    const innerState = this._innerView.state;
    this._innerView.focus();

    // request outer cursor position before math node was selected
    const maybePos = this._mathPluginKey.getState(
      this._outerView.state
    )?.prevCursorPos;
    if (maybePos === null || maybePos === undefined) {
      console.error(
        "[prosemirror-math] Error:  Unable to fetch math plugin state from key."
      );
    }
    const prevCursorPos: number = maybePos ?? 0;

    // compute position that cursor should appear within the expanded math node
    const innerPos =
      prevCursorPos <= this._getPos() ? 0 : this._node.nodeSize - 2;

    setTimeout(() => {
      if (!this._innerView) return;

      this._innerView.focus();
      this._innerView.dispatch(
        innerState.tr.setSelection(
          TextSelection.create(innerState.doc, innerPos)
        )
      );
    });

    this._isEditing = true;
  }

  /**
   * Called when the inner ProseMirror editor should close.
   *
   * @param render Optionally update the rendered math after closing. (which
   *    is generally what we want to do, since the user is done editing!)
   */
  closeEditor(render = true) {
    if (this._innerView) {
      this._innerView.destroy();
      this._innerView = undefined;
    }

    if (render) {
      this.renderMath();
    }
    this._isEditing = false;
  }
}
