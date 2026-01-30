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

import { useEffect, useRef, useState } from "react";
import { FloatingMenuProps } from "./types.js";
import { SearchReplacePopup } from "../popups/search-replace.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { getToolbarElement } from "../utils/dom.js";
import { useEditorSearchStore } from "../stores/search-store.js";

export function SearchReplaceFloatingMenu(props: FloatingMenuProps) {
  const { editor, editorId, toolbarRef } = props;
  const isSearching = useEditorSearchStore((store) =>
    editorId ? store.getSearchState(editorId).isSearching : false
  );
  const [hasFocus, setHasFocus] = useState(
    editor.isFocused || editor.storage.isSearchFocused
  );
  const popupContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onFocus() {
      setHasFocus(true);
    }
    function onBlur({ event }: { event: FocusEvent }) {
      if (
        event?.relatedTarget &&
        (popupContainerRef.current?.contains(event.relatedTarget as Node) ||
          (event.relatedTarget as HTMLElement).closest(".popup-presenter"))
      ) {
        return;
      }
      setHasFocus(false);
    }

    editor.on("focus", onFocus);
    editor.on("blur", onBlur);
    return () => {
      editor.off("focus", onFocus);
      editor.off("blur", onBlur);
    };
  }, [editor]);

  // wait for the ref to be available
  useEffect(() => {
    if (editor.isFocused) setHasFocus(true);
  }, [popupContainerRef.current, editor.isFocused]);

  useEffect(() => {
    if (isSearching) setHasFocus(true);
  }, [isSearching]);

  if (!isSearching) return null;

  return (
    <ResponsivePresenter
      mobile="sheet"
      desktop="popup"
      scope="dialog"
      isOpen={isSearching && hasFocus}
      onClose={() => editor.commands.endSearch()}
      position={{
        target: toolbarRef?.current || getToolbarElement(editorId),
        isTargetAbsolute: true,
        location: "below",
        align: "end",
        yOffset: 5
      }}
      blocking={false}
      focusOnRender={false}
      draggable={false}
      shouldCloseOnOverlayClick={false}
    >
      <div
        ref={popupContainerRef}
        onFocus={() => setHasFocus(true)}
        onBlur={(e) => {
          if (
            e.relatedTarget &&
            (e.relatedTarget === editor.view.dom ||
              popupContainerRef.current?.contains(e.relatedTarget) ||
              (e.relatedTarget as HTMLElement).closest(".popup-presenter"))
          ) {
            return;
          }
          setHasFocus(false);
        }}
        tabIndex={-1}
        style={{ outline: "none" }}
      >
        <SearchReplacePopup editor={editor} editorId={editorId} />
      </div>
    </ResponsivePresenter>
  );
}
