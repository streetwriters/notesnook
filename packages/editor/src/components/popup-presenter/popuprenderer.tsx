import React, { PropsWithChildren, useContext } from "react";
import { Editor } from "@tiptap/core";
import ReactDOM from "react-dom";
import { PopupPresenter } from ".";

export const PopupRendererContext = React.createContext<PopupRenderer | null>(
  null
);
export const EditorContext = React.createContext<Editor | null>(null);

export type PopupRendererProps = PropsWithChildren<{ editor: Editor }>;
type PopupRendererState = {
  popups: { id: string; popup: React.FunctionComponent }[];
};
export class PopupRenderer extends React.Component<
  PopupRendererProps,
  PopupRendererState,
  PopupRendererState
> {
  popupContainer: HTMLDivElement | null = null;
  state: PopupRendererState = {
    popups: [] as PopupRendererState["popups"],
  };

  openPopup = (id: string, popup: React.FunctionComponent) => {
    if (!popup) return;
    this.setState((prev) => {
      return {
        popups: [...prev.popups, { id, popup }],
      };
    });
  };

  closePopup = (id: string) => {
    this.setState((prev) => {
      const index = prev.popups.findIndex((p) => p.id === id);
      if (index <= -1) return prev;
      console.log(index, id, prev.popups[index]);
      const clone = prev.popups.slice();
      clone.splice(index, 1);
      return {
        popups: clone,
      };
    });
  };

  render(): React.ReactNode {
    return (
      <PopupRendererContext.Provider value={this}>
        {this.props.children}
        <EditorContext.Provider value={this.props.editor}>
          {this.state.popups.map(({ id, popup: Popup }) => {
            console.log(id, Popup);
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
