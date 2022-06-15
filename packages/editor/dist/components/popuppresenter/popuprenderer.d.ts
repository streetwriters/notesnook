import React, { PropsWithChildren } from "react";
import { Editor } from "@tiptap/core";
export declare const PopupRendererContext: React.Context<PopupRenderer | null>;
export declare const EditorContext: React.Context<Editor | null>;
export declare type PopupRendererProps = PropsWithChildren<{
    editor: Editor;
}>;
declare type PopupRendererState = {
    popups: Record<string, React.FunctionComponent>;
};
export declare class PopupRenderer extends React.Component<PopupRendererProps> {
    popupContainer: HTMLDivElement | null;
    state: PopupRendererState;
    openPopup(id: string, popup: React.FunctionComponent): void;
    closePopup(id: string): void;
    render(): React.ReactNode;
}
export declare function usePopupRenderer(): PopupRenderer | null;
export declare function useEditorContext(): Editor;
export {};
