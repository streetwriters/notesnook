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

import { MenuPresenter } from "@notesnook/ui";
import { Editor } from "@tiptap/core";
import {
  SuggestionKeyDownProps,
  SuggestionOptions,
  SuggestionProps
} from "@tiptap/suggestion";
import { showPopup } from "../../components/popup-presenter";

export type SuggestionMenuItem =
  /**
   * TODO: use `group` field instead of `|`
   */
  | "|"
  | {
      id: string;
      name: string;
      icon?: string;
      shortcut?: string;
      action: (editor: Editor) => void;
    };

/**
 * Intended for use with the `render` method of `Suggestion` extension.
 */
export class SuggestionMenuView
  implements ReturnType<NonNullable<SuggestionOptions["render"]>>
{
  private readonly editor: Editor;

  private _hideMenu: (() => void) | undefined;
  private _items: SuggestionMenuItem[] | undefined;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  public onStart(props: SuggestionProps) {
    this._items = [];

    this.onUpdate(props);
  }

  public onUpdate(props: SuggestionProps) {
    if (this._items === undefined) {
      return;
    }

    this._items = props.items;

    this._render();
  }

  public onKeyDown(props: SuggestionKeyDownProps) {
    if (this._items === undefined) {
      return false;
    }

    if (props.event.key === "Escape") {
      if (this._hideMenu) {
        this._hideMenu();
      }
      return true;
    }
    if (["Enter", "ArrowUp", "ArrowDown"].includes(props.event.key)) {
      return true;
    }
    return false;
  }

  public onExit(props: SuggestionProps) {
    if (this._hideMenu === undefined || this._items === undefined) {
      return;
    }

    this._hideMenu();

    this._items = undefined;
    this._hideMenu = undefined;
  }

  private _render() {
    if (this._items === undefined) {
      return;
    }

    const { state } = this.editor;
    const { $from } = state.selection;
    const selectedElement = this.editor.view.domAtPos($from.pos)
      .node as HTMLElement;
    const y = selectedElement.getBoundingClientRect().top + window.scrollY;
    const location: "top" | "below" =
      window.innerHeight - y < 300 ? "top" : "below";

    const hidePopup = showPopup({
      popup: () => {
        return (
          <MenuPresenter
            sx={{
              width: 300,
              height: "fit-content",
              maxHeight: 250
            }}
            autoSelectFirstItem={true}
            items={
              this._items && this._items.length > 0
                ? this._items.map((item, index) => {
                    if (typeof item === "string") {
                      return {
                        type: "separator",
                        key: index.toString()
                      };
                    }
                    return {
                      type: "button",
                      key: item.id,
                      title: item.name,
                      icon: item.icon,
                      onClick: () => {
                        item.action(this.editor);
                      }
                    };
                  })
                : [
                    {
                      type: "button",
                      key: "no-result-found",
                      title: "No result found",
                      isDisabled: true
                    }
                  ]
            }
            isOpen={true}
            onClose={() => hidePopup()}
            blocking={false}
            focusOnRender={false}
            position={{
              target: selectedElement,
              isTargetAbsolute: true,
              location: location,
              yOffset: 5,
              xOffset: 5
            }}
          />
        );
      },
      blocking: false,
      focusOnRender: false,
      position: {
        target: selectedElement,
        isTargetAbsolute: true,
        yOffset: 5,
        xOffset: 5
      }
    });
    this._hideMenu = hidePopup;
  }
}
