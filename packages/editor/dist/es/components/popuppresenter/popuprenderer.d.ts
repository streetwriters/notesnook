import React, { PropsWithChildren } from "react";
import { Editor } from "@tiptap/core";
export declare const PopupRendererContext: React.Context<PopupRenderer | null>;
export declare const EditorContext: React.Context<Editor | null>;
export declare type PopupRendererProps = PropsWithChildren<{
    editor: Editor;
}>;
declare type PopupComponent = React.FunctionComponent<{
    id: string;
}>;
declare type PopupRendererState = {
    popups: {
        id: string;
        popup: PopupComponent;
    }[];
};
export declare class PopupRenderer extends React.Component<PopupRendererProps, PopupRendererState, PopupRendererState> {
    popupContainer: HTMLDivElement | null;
    state: PopupRendererState;
    openPopup: (id: string, popup: PopupComponent) => void;
    closePopup: (id: string) => void;
    render(): React.ReactNode;
}
export declare function usePopupRenderer(): PopupRenderer | null;
export declare function useEditorContext(): Editor;
export {};
