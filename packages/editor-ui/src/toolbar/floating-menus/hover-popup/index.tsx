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

import { useEffect, useMemo, useRef, type ComponentType } from "react";
import { showPopup } from "../../../components/popup-presenter/index.js";
import type { EditorController } from "../../../controller.js";
import { q } from "../../../queries/queries.js";
import { useControllerQuery as useEditorQuery } from "../../../queries/use-query.js";
import { LinkHoverPopupHandler } from "./link.js";
import { HoverPopupContextProvider } from "./context.js";

export type HoverPopupProps = {
  editor: EditorController;
};

const handlers = [LinkHoverPopupHandler];

const HOVER_TIMEOUT = 1000;

/** The popup body: waits for the node under the pointer, then renders it. */
function HoverPopupContent(props: {
  editor: EditorController;
  pos: number;
  hide: () => void;
  Popup: ComponentType<HoverPopupProps>;
}) {
  const { editor, pos, hide, Popup } = props;
  const query = useMemo(() => q.nodeAt(pos), [pos]);
  const node = useEditorQuery(editor, query);
  if (!node) return null;
  return (
    <HoverPopupContextProvider value={{ selectedNode: node, hide }}>
      <Popup editor={editor} />
    </HoverPopupContextProvider>
  );
}

export function HoverPopupHandler(props: HoverPopupProps) {
  const { editor } = props;
  const hoverTimeoutId = useRef<number>();
  const activePopup = useRef<{ element: HTMLElement; hide: () => void }>();

  useEffect(() => {
    return editor.onDestroy(() => activePopup.current?.hide());
  }, [editor]);

  useEffect(
    () => {
      // hovering is a DOM concern: an engine that cannot say which position
      // an element is at has no hover popups
      if (!editor.posAtElement) return;
      function onContextMenu(e: MouseEvent) {
        if (
          !e.target ||
          !(e.target instanceof HTMLElement) ||
          e.target.classList.contains("ProseMirror")
        )
          return;

        clearTimeout(hoverTimeoutId.current);
      }
      function onMouseOver(e: MouseEvent) {
        if (
          !e.target ||
          !(e.target instanceof HTMLElement) ||
          e.target.classList.contains("ProseMirror")
        )
          return;

        const element = e.target;

        if (activePopup.current) {
          const isInsidePopup = element.closest(".popup-presenter-portal");
          const isActiveElement = activePopup.current.element === element;
          if (isInsidePopup || isActiveElement) return;

          activePopup.current.hide();
          activePopup.current = undefined;
        }

        clearTimeout(hoverTimeoutId.current);

        hoverTimeoutId.current = setTimeout(
          () => {
            const PopupHandler = handlers.find((h) => h.isActive(element));
            if (!PopupHandler) return;

            const { popup: Popup } = PopupHandler;

            const pos = editor.posAtElement?.(element);
            if (pos === undefined) return;

            const hidePopup = showPopup({
              popup: () => (
                <HoverPopupContent
                  editor={editor}
                  pos={pos}
                  hide={() => hidePopup()}
                  Popup={Popup}
                />
              ),
              blocking: false,
              focusOnRender: false,
              editor,
              anchor: { range: { from: pos, to: pos + node.nodeSize } },
              placement: "top-start"
            });
            activePopup.current = { element, hide: hidePopup };
          },
          HOVER_TIMEOUT,
          {}
        );
      }
      window.addEventListener("mouseover", onMouseOver);
      window.addEventListener("contextmenu", onContextMenu);
      return () => {
        window.removeEventListener("mouseover", onMouseOver);
        window.removeEventListener("contextmenu", onContextMenu);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return null;
}
