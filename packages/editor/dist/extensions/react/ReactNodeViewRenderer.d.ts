import { NodeViewRenderer, NodeViewRendererOptions } from "@tiptap/core";
import { Decoration } from "prosemirror-view";
import { Node as ProseMirrorNode } from "prosemirror-model";
export interface ReactNodeViewRendererOptions extends NodeViewRendererOptions {
    update: ((props: {
        oldNode: ProseMirrorNode;
        oldDecorations: Decoration[];
        newNode: ProseMirrorNode;
        newDecorations: Decoration[];
        updateProps: () => void;
    }) => boolean) | null;
    as?: string;
    className?: string;
}
export declare function ReactNodeViewRenderer(component: any, options?: Partial<ReactNodeViewRendererOptions>): NodeViewRenderer;
