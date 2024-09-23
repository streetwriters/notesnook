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

import { ToolProps } from "../types.js";
import { ToolButton } from "../components/tool-button.js";
import { MoreTools } from "../components/more-tools.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { findSelectedNode, selectionToOffset } from "../../utils/prosemirror.js";

export function WebClipSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("webclip") || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="webclipSettings"
      tools={["webclipFullScreen", "webclipOpenSource"]}
    />
  );
}

export function WebClipFullScreen(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => {
        const offset = selectionToOffset(editor.state);
        if (!offset) return;

        const dom = editor.view.nodeDOM(offset.from);
        if (!dom || !(dom instanceof HTMLElement)) return;

        const iframe = dom.querySelector("iframe");
        if (!iframe) return;

        iframe.requestFullscreen();
        editor.commands.updateAttributes("webclip", {
          fullscreen: true
        });
      }}
    />
  );
}

export function WebClipOpenExternal(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={async () => {
        const offset = selectionToOffset(editor.state);
        if (!offset) return;

        const dom = editor.view.nodeDOM(offset.from);
        if (!dom || !(dom instanceof HTMLElement)) return;

        const iframe = dom.querySelector("iframe");
        if (!iframe || !iframe.contentDocument) return;

        const url = URL.createObjectURL(
          new Blob(
            ["\ufeff", iframe.contentDocument.documentElement.outerHTML],
            { type: "text/html" }
          )
        );
        editor.storage.openLink?.(url);
      }}
    />
  );
}

export function WebClipOpenSource(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={async () => {
        const node = findSelectedNode(editor, "webclip");
        if (!node) return;
        editor.storage.openLink?.(node.attrs.src);
      }}
    />
  );
}
