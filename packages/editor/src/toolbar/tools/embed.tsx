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
import { useMemo, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { MoreTools } from "../components/more-tools.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { findSelectedNode } from "../../utils/prosemirror.js";
import { Embed } from "../../extensions/embed/index.js";
import { EmbedPopup } from "../popups/embed-popup.js";
import { strings } from "@notesnook/intl";

export function EmbedSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("embed") || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="embedSettings"
      tools={[
        "embedAlignLeft",
        "embedAlignCenter",
        "embedAlignRight",
        "embedProperties"
      ]}
    />
  );
}

export function EmbedAlignLeft(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.chain().focus().setEmbedAlignment({ align: "left" }).run()
      }
    />
  );
}

export function EmbedAlignRight(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.chain().focus().setEmbedAlignment({ align: "right" }).run()
      }
    />
  );
}

export function EmbedAlignCenter(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.chain().focus().setEmbedAlignment({ align: "center" }).run()
      }
    />
  );
}

// TODO: stop re-rendering
export function EmbedProperties(props: ToolProps) {
  const { editor } = props;
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // TODO: improve perf by deferring this until user opens the popup
  const embedNode = useMemo(() => findSelectedNode(editor, "embed"), [editor]);
  const embed = (embedNode?.attrs || {}) as Embed;

  return (
    <>
      <ToolButton
        buttonRef={buttonRef}
        toggled={isOpen}
        {...props}
        onClick={() => setIsOpen((s) => !s)}
      />

      <ResponsivePresenter
        isOpen={isOpen}
        desktop="popup"
        mobile="sheet"
        onClose={() => setIsOpen(false)}
        blocking
        focusOnRender={false}
        position={{
          target: buttonRef.current || "mouse",
          align: "start",
          location: "below",
          yOffset: 10,
          isTargetAbsolute: true
        }}
      >
        <EmbedPopup
          title={strings.embedProperties()}
          onClose={(newEmbed) => {
            if (!newEmbed) {
              editor.commands.setEmbedSize(embed);
            } else if (newEmbed.src !== embed.src)
              editor.commands.setEmbedSource(newEmbed.src);

            setIsOpen(false);
          }}
          embed={embed}
          onSizeChanged={(size) => editor.commands.setEmbedSize(size)}
        />
      </ResponsivePresenter>
    </>
  );
}
