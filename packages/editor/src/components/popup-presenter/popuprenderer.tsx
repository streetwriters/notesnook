import React, { PropsWithChildren, useContext } from "react";
import { Editor } from "@tiptap/core";
import ReactDOM from "react-dom";
import { PopupPresenter } from ".";

export const PopupRendererContext = React.createContext<PopupRenderer | null>(
  null
);
export const EditorContext = React.createContext<Editor | null>(null);

export type PopupRendererProps = PropsWithChildren<{ editor: Editor }>;
type PopupRendererState = { popups: Record<string, React.FunctionComponent> };
export class PopupRenderer extends React.Component<PopupRendererProps> {
  popupContainer: HTMLDivElement | null = null;
  state: PopupRendererState = {
    popups: {} as Record<string, React.FunctionComponent>,
  };

  openPopup(id: string, popup: React.FunctionComponent) {
    this.setState({ popups: { ...this.state.popups, [id]: popup } });
  }

  closePopup(id: string) {
    this.setState({ popups: { ...this.state.popups, [id]: null } });
  }

  render(): React.ReactNode {
    return (
      <PopupRendererContext.Provider value={this}>
        {this.props.children}
        <EditorContext.Provider value={this.props.editor}>
          {Object.entries(this.state.popups).map(([id, Popup]) => {
            if (!Popup) return null;
            return <Popup key={id} />;
          })}
          <div id="popup-container" />
        </EditorContext.Provider>
      </PopupRendererContext.Provider>
    );
  }
}

export function usePopupRenderer() {
  return useContext(PopupRendererContext);
}
export function useEditorContext() {
  return useContext(EditorContext)!;
}
