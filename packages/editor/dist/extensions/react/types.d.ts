/// <reference types="react" />
import { Editor } from "@tiptap/core";
import { Node as PMNode, Attrs } from "prosemirror-model";
export interface ReactNodeProps {
    selected: boolean;
}
export declare type GetPos = GetPosNode | boolean;
export declare type GetPosNode = () => number;
export declare type ForwardRef = (node: HTMLElement | null) => void;
export declare type ShouldUpdate = (prevNode: PMNode, nextNode: PMNode) => boolean;
export declare type UpdateAttributes<T> = (attributes: Partial<T>) => void;
export declare type ContentDOM = {
    dom: HTMLElement;
    contentDOM?: HTMLElement | null | undefined;
} | undefined;
export declare type ReactComponentProps<TAttributes = Attrs> = {
    getPos: GetPos;
    node: PMNode & {
        attrs: TAttributes;
    };
    editor: Editor;
    updateAttributes: UpdateAttributes<TAttributes>;
    forwardRef?: ForwardRef;
};
export declare type ReactNodeViewOptions<P> = {
    props?: P;
    component?: React.ComponentType<P & ReactComponentProps>;
    shouldUpdate?: ShouldUpdate;
    contentDOMFactory?: () => ContentDOM;
    wrapperFactory?: () => HTMLElement;
};
