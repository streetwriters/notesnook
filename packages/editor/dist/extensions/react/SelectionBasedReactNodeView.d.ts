import React from "react";
import { Node as PMNode } from "prosemirror-model";
import { PortalProviderAPI } from "./ReactNodeViewPortals";
import { EventDispatcher } from "./event-dispatcher";
import { ReactComponentProps, GetPos, ReactNodeViewOptions } from "./types";
import ReactNodeView from "./ReactNodeView";
import { Editor, NodeViewRendererProps } from "@tiptap/core";
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
export declare class SelectionBasedNodeView<P = ReactComponentProps> extends ReactNodeView<P> {
    private oldSelection;
    private selectionChangeState;
    pos: number | undefined;
    posEnd: number | undefined;
    constructor(node: PMNode, editor: Editor, getPos: GetPos, portalProviderAPI: PortalProviderAPI, eventDispatcher: EventDispatcher, options: ReactNodeViewOptions<P>);
    /**
     * Update current node's start and end positions.
     *
     * Prefer `this.pos` rather than getPos(), because calling getPos is
     * expensive, unless you know you're definitely going to render.
     */
    private updatePos;
    private getPositionsWithDefault;
    isNodeInsideSelection: (from: number, to: number, pos?: number, posEnd?: number) => boolean;
    isSelectionInsideNode: (from: number, to: number, pos?: number, posEnd?: number) => boolean;
    private isSelectedNode;
    insideSelection: () => boolean;
    nodeInsideSelection: () => boolean;
    viewShouldUpdate(_nextNode: PMNode): boolean;
    destroy(): void;
    private onSelectionChange;
    static fromComponent<TProps>(component: React.ComponentType<TProps & ReactComponentProps>, options?: Omit<ReactNodeViewOptions<TProps>, "component">): ({ node, getPos, editor }: NodeViewRendererProps) => SelectionBasedNodeView<TProps>;
}
