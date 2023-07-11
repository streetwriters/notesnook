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

import React from "react";
import { DecorationSet } from "prosemirror-view";
import { Node as PMNode } from "prosemirror-model";
import { Selection, NodeSelection } from "prosemirror-state";
import {
  stateKey as SelectionChangePluginKey,
  ReactNodeViewState
} from "./plugin";
import {
  ReactNodeViewOptions,
  GetPosNode,
  SelectionBasedReactNodeViewProps,
  ForwardRef
} from "./types";
import { ReactNodeView } from "./react-node-view";
import { Editor, NodeViewRendererProps } from "@tiptap/core";
import { ThemeProvider } from "../../components/theme-provider";

/**
 * A ReactNodeView that handles React components sensitive
 * to selection changes.
 *
 * If the selection changes, it will attempt to re-render the
 * React component. Otherwise it does nothing.
 *
 * You can subclass `viewShouldUpdate` to include other
 * props that your component might want to consider before
 * entering the React lifecycle. These are usually props you
 * compare in `shouldComponentUpdate`.
 *
 * An example:
 *
 * ```
 * viewShouldUpdate(nextNode) {
 *   if (nextNode.attrs !== this.node.attrs) {
 *     return true;
 *   }
 *
 *   return super.viewShouldUpdate(nextNode);
 * }```
 */

export class SelectionBasedNodeView<
  P extends SelectionBasedReactNodeViewProps
> extends ReactNodeView<P> {
  private oldSelection: Selection;
  private selectionChangeState: ReactNodeViewState;

  pos = -1;
  posEnd: number | undefined;

  constructor(
    node: PMNode,
    editor: Editor,
    getPos: GetPosNode,
    options: ReactNodeViewOptions<P>
  ) {
    super(node, editor, getPos, options);

    this.updatePos();

    this.oldSelection = editor.view.state.selection;
    this.selectionChangeState = SelectionChangePluginKey.getState(
      this.editor.view.state
    );
    this.selectionChangeState.subscribe(this.onSelectionChange);
  }

  render(
    props: P = {} as P,
    forwardRef?: ForwardRef
  ): React.ReactElement<unknown> | null {
    if (!this.options.component) return null;
    const isSelected =
      (this.options.forceEnableSelection || this.editor.isEditable) &&
      this.isSelectedNode(this.editor.view.state.selection);

    return (
      <ThemeProvider injectCssVars={false}>
        <this.options.component
          {...props}
          editor={this.editor}
          getPos={this.getPos}
          node={this.node}
          forwardRef={forwardRef}
          selected={isSelected}
          updateAttributes={(attr, options) =>
            this.updateAttributes(
              attr,
              this.pos,
              options?.addToHistory,
              options?.preventUpdate,
              options?.forceUpdate
            )
          }
        />
      </ThemeProvider>
    );
  }

  /**
   * Update current node's start and end positions.
   *
   * Prefer `this.pos` rather than getPos(), because calling getPos is
   * expensive, unless you know you're definitely going to render.
   */
  private updatePos() {
    if (typeof this.getPos === "boolean") {
      return;
    }
    this.pos = this.getPos();
    this.posEnd = this.pos + this.node.nodeSize;
  }

  private getPositionsWithDefault(pos?: number, posEnd?: number) {
    return {
      pos: typeof pos !== "number" ? this.pos : pos,
      posEnd: typeof posEnd !== "number" ? this.posEnd : posEnd
    };
  }

  isNodeInsideSelection = (
    from: number,
    to: number,
    pos?: number,
    posEnd?: number
  ) => {
    ({ pos, posEnd } = this.getPositionsWithDefault(pos, posEnd));

    if (typeof pos !== "number" || typeof posEnd !== "number") {
      return false;
    }

    return from <= pos && to >= posEnd;
  };

  isSelectionInsideNode = (
    from: number,
    to: number,
    pos?: number,
    posEnd?: number
  ) => {
    ({ pos, posEnd } = this.getPositionsWithDefault(pos, posEnd));

    if (typeof pos !== "number" || typeof posEnd !== "number") {
      return false;
    }

    return pos < from && to < posEnd;
  };

  private isSelectedNode = (selection: Selection): boolean => {
    if (selection instanceof NodeSelection) {
      const {
        selection: { from, to }
      } = this.editor.view.state;
      return (
        selection.node === this.node ||
        // If nodes are not the same object, we check if they are referring to the same document node
        (this.pos === from &&
          this.posEnd === to &&
          selection.node.eq(this.node))
      );
    }
    return false;
  };

  insideSelection = () => {
    const {
      selection: { from, to }
    } = this.editor.view.state;

    return (
      this.isSelectedNode(this.editor.view.state.selection) ||
      this.isSelectionInsideNode(from, to)
    );
  };

  nodeInsideSelection = () => {
    const { selection } = this.editor.view.state;
    const { from, to } = selection;

    return (
      this.isSelectedNode(selection) || this.isNodeInsideSelection(from, to)
    );
  };

  viewShouldUpdate(nextNode: PMNode) {
    if (super.viewShouldUpdate(nextNode)) return true;

    const {
      state: { selection }
    } = this.editor.view;

    // update selection
    const oldSelection = this.oldSelection;
    this.oldSelection = selection;

    // update cached positions
    const { pos: oldPos, posEnd: oldPosEnd } = this;
    this.updatePos();

    const { from, to } = selection;
    const { from: oldFrom, to: oldTo } = oldSelection;

    if (this.node.type.spec.selectable) {
      const newNodeSelection =
        selection instanceof NodeSelection && selection.from === this.pos;
      const oldNodeSelection =
        oldSelection instanceof NodeSelection && oldSelection.from === this.pos;

      if (
        (newNodeSelection && !oldNodeSelection) ||
        (oldNodeSelection && !newNodeSelection)
      ) {
        return true;
      }
    }

    const movedInToSelection =
      this.isNodeInsideSelection(from, to) &&
      !this.isNodeInsideSelection(oldFrom, oldTo);

    const movedOutOfSelection =
      !this.isNodeInsideSelection(from, to) &&
      this.isNodeInsideSelection(oldFrom, oldTo);

    const moveOutFromOldSelection =
      this.isNodeInsideSelection(from, to, oldPos, oldPosEnd) &&
      !this.isNodeInsideSelection(from, to);

    if (movedInToSelection || movedOutOfSelection || moveOutFromOldSelection) {
      return true;
    }

    return false;
  }

  destroy() {
    this.selectionChangeState.unsubscribe(this.onSelectionChange);
    super.destroy();
  }

  private onSelectionChange = () => {
    this.update(this.node, [], DecorationSet.empty);
  };
}

export function createSelectionBasedNodeView<
  TProps extends SelectionBasedReactNodeViewProps
>(
  component: React.ComponentType<TProps>,
  options?: Omit<ReactNodeViewOptions<TProps>, "component">
) {
  return ({ node, getPos, editor }: NodeViewRendererProps) => {
    const _getPos = () => (typeof getPos === "boolean" ? -1 : getPos());
    return new SelectionBasedNodeView(node, editor as Editor, _getPos, {
      ...options,
      component
    }).init();
  };
}
