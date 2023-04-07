/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React, { PropsWithChildren, useContext } from "react";
import { Editor } from "@tiptap/core";

export const PopupRendererContext = React.createContext<PopupRenderer | null>(
  null
);
export const EditorContext = React.createContext<Editor | null>(null);

export type PopupRendererProps = PropsWithChildren<{ editor: Editor }>;
type PopupComponent = React.FunctionComponent<{ id: string }>;
type PopupRendererState = {
  popups: { id: string; popup: PopupComponent }[];
};
export class PopupRenderer extends React.Component<
  PopupRendererProps,
  PopupRendererState,
  PopupRendererState
> {
  popupContainer: HTMLDivElement | null = null;
  state: PopupRendererState = {
    popups: [] as PopupRendererState["popups"]
  };

  isOpen(id: string) {
    return !!this.state.popups?.find((popup) => popup.id === id);
  }

  openPopup = (id: string, popup: PopupComponent) => {
    if (!popup) return;
    this.setState((prev) => {
      return {
        popups: [...prev.popups, { id, popup }]
      };
    });
  };

  closePopup = (id: string) => {
    this.setState((prev) => {
      const index = prev.popups.findIndex((p) => p.id === id);
      if (index <= -1) return prev;
      const clone = prev.popups.slice();
      clone.splice(index, 1);
      return {
        popups: clone
      };
    });
  };

  render() {
    return (
      <PopupRendererContext.Provider value={this}>
        {this.props.children}
        <EditorContext.Provider value={this.props.editor}>
          {this.state.popups.map(({ id, popup: Popup }) => {
            return <Popup key={id} id={id} />;
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
