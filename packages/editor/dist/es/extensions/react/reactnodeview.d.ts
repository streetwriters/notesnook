import React from "react";
import { NodeView, Decoration, DecorationSource } from "prosemirror-view";
import { Node as PMNode } from "prosemirror-model";
import { PortalProviderAPI } from "./react-portal-provider";
import { ReactNodeViewProps, ReactNodeViewOptions, GetPosNode, ForwardRef, ContentDOM } from "./types";
import { NodeViewRendererProps } from "@tiptap/core";
import { Editor } from "../../types";
export declare class ReactNodeView<P extends ReactNodeViewProps> implements NodeView {
    protected readonly editor: Editor;
    protected readonly getPos: GetPosNode;
    protected readonly options: ReactNodeViewOptions<P>;
    private domRef;
    private contentDOMWrapper?;
    contentDOM: HTMLElement | undefined;
    node: PMNode;
    isDragging: boolean;
    portalProviderAPI: PortalProviderAPI;
    constructor(node: PMNode, editor: Editor, getPos: GetPosNode, options: ReactNodeViewOptions<P>);
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
    updateAttributes(attributes: any, pos: number): void;
    update(node: PMNode, _decorations: readonly Decoration[], _innerDecorations: DecorationSource): boolean;
    onDragStart(event: DragEvent): void;
    stopEvent(event: Event): boolean;
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
}
export declare function createNodeView<TProps extends ReactNodeViewProps>(component: React.ComponentType<TProps>, options?: Omit<ReactNodeViewOptions<TProps>, "component">): ({ node, getPos, editor }: NodeViewRendererProps) => ReactNodeView<TProps>;
