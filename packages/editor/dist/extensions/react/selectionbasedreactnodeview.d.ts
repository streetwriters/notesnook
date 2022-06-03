import React from "react";
import { Node as PMNode } from "prosemirror-model";
import { PortalProviderAPI } from "./react-portal-provider";
import { EventDispatcher } from "./event-dispatcher";
import { ReactNodeViewOptions, GetPosNode, SelectionBasedReactNodeViewProps, ForwardRef } from "./types";
import { ReactNodeView } from "./react-node-view";
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
export declare class SelectionBasedNodeView<P extends SelectionBasedReactNodeViewProps> extends ReactNodeView<P> {
    private oldSelection;
    private selectionChangeState;
    pos: number;
    posEnd: number | undefined;
    constructor(node: PMNode, editor: Editor, getPos: GetPosNode, portalProviderAPI: PortalProviderAPI, eventDispatcher: EventDispatcher, options: ReactNodeViewOptions<P>);
    render(props?: P, forwardRef?: ForwardRef): React.ReactElement<any> | null;
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
}
export declare function createSelectionBasedNodeView<TProps extends SelectionBasedReactNodeViewProps>(component: React.ComponentType<TProps>, options?: Omit<ReactNodeViewOptions<TProps>, "component">): ({ node, getPos, editor }: NodeViewRendererProps) => SelectionBasedNodeView<TProps>;
