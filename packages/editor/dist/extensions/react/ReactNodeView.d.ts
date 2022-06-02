import React from "react";
import { NodeView, Decoration, DecorationSource } from "prosemirror-view";
import { Node as PMNode } from "prosemirror-model";
import { PortalProviderAPI } from "./ReactNodeViewPortals";
import { EventDispatcher } from "./event-dispatcher";
import { ReactComponentProps, ReactNodeViewOptions, GetPos, ForwardRef, ContentDOM } from "./types";
import { Editor, NodeViewRendererProps } from "@tiptap/core";
export default class ReactNodeView<P> implements NodeView {
    protected readonly editor: Editor;
    protected readonly getPos: GetPos;
    protected readonly portalProviderAPI: PortalProviderAPI;
    protected readonly eventDispatcher: EventDispatcher;
    protected readonly options: ReactNodeViewOptions<P>;
    private domRef;
    private contentDOMWrapper?;
    contentDOM: HTMLElement | undefined;
    node: PMNode;
    constructor(node: PMNode, editor: Editor, getPos: GetPos, portalProviderAPI: PortalProviderAPI, eventDispatcher: EventDispatcher, options: ReactNodeViewOptions<P>);
    /**
     * This method exists to move initialization logic out of the constructor,
     * so object can be initialized properly before calling render first time.
     *
     * Example:
     * Instance properties get added to an object only after super call in
     * constructor, which leads to some methods being undefined during the
     * first render.
     */
    init(): this;
    private renderReactComponent;
    createDomRef(): HTMLElement;
    getContentDOM(): ContentDOM;
    handleRef: (node: HTMLElement | null) => void;
    private _handleRef;
    render(props?: P, forwardRef?: ForwardRef): React.ReactElement<any> | null;
    private updateAttributes;
    update(node: PMNode, _decorations: readonly Decoration[], _innerDecorations: DecorationSource): boolean;
    ignoreMutation(mutation: MutationRecord | {
        type: "selection";
        target: Element;
    }): boolean;
    viewShouldUpdate(nextNode: PMNode): boolean;
    /**
     * Copies the attributes from a ProseMirror Node to a DOM node.
     * @param node The Prosemirror Node from which to source the attributes
     */
    setDomAttrs(node: PMNode, element: HTMLElement): void;
    get dom(): HTMLElement;
    destroy(): void;
    static fromComponent<TProps>(component: React.ComponentType<TProps & ReactComponentProps>, options?: Omit<ReactNodeViewOptions<TProps>, "component">): ({ node, getPos, editor }: NodeViewRendererProps) => ReactNodeView<TProps>;
}
