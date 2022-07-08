/// <reference types="react" />
import { Editor } from "../../types";
import { Node as PMNode, Attrs } from "prosemirror-model";
export interface ReactNodeProps {
    selected: boolean;
}
export declare type NodeWithAttrs<T> = PMNode & {
    attrs: T;
};
export declare type GetPos = GetPosNode | boolean;
export declare type GetPosNode = () => number;
export declare type ForwardRef = (node: HTMLElement | null) => void;
export declare type ShouldUpdate = (prevNode: PMNode, nextNode: PMNode) => boolean;
export declare type UpdateAttributes<T> = (attributes: Partial<T>, options?: {
    addToHistory?: boolean;
    preventUpdate?: boolean;
}) => void;
export declare type ContentDOM = {
    dom: HTMLElement;
    contentDOM?: HTMLElement | null | undefined;
} | undefined;
export declare type ReactNodeViewProps<TAttributes = Attrs> = {
    getPos: GetPosNode;
    node: NodeWithAttrs<TAttributes>;
    editor: Editor;
    updateAttributes: UpdateAttributes<TAttributes>;
    forwardRef?: ForwardRef;
};
export declare type SelectionBasedReactNodeViewProps<TAttributes = Attrs> = ReactNodeViewProps<TAttributes> & {
    selected: boolean;
};
export declare type ReactNodeViewOptions<P> = {
    props?: P;
    component?: React.ComponentType<P>;
    shouldUpdate?: ShouldUpdate;
    contentDOMFactory?: (() => ContentDOM) | boolean;
    wrapperFactory?: () => HTMLElement;
};
