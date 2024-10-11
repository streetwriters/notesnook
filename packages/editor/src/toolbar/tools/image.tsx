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
import { useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { MoreTools } from "../components/more-tools.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { ImageProperties as ImagePropertiesPopup } from "../popups/image-properties.js";
import { findSelectedNode } from "../../utils/prosemirror.js";
import { ImageAttributes } from "../../extensions/image/index.js";

export function ImageSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";

  if (!editor.isActive("image") || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="imageSettings"
      tools={
        editor.isEditable
          ? [
              "downloadAttachment",
              "imageAlignLeft",
              "imageAlignCenter",
              "imageAlignRight",
              "imageFloat",
              "imageProperties"
            ]
          : ["downloadAttachment"]
      }
    />
  );
}

export function ImageAlignLeft(props: ToolProps) {
  const { editor } = props;
  const image = findSelectedNode(editor, "image");
  if (!image) return null;

  const { align } = image.attrs as ImageAttributes;

  return (
    <ToolButton
      {...props}
      toggled={!align || align === "left"}
      onClick={() =>
        editor.chain().focus().setImageAlignment({ align: "left" }).run()
      }
    />
  );
}

export function ImageAlignRight(props: ToolProps) {
  const { editor } = props;
  const image = findSelectedNode(editor, "image");
  if (!image) return null;

  const { align } = image.attrs as ImageAttributes;

  return (
    <ToolButton
      {...props}
      toggled={align === "right"}
      onClick={() =>
        editor.chain().focus().setImageAlignment({ align: "right" }).run()
      }
    />
  );
}

export function ImageAlignCenter(props: ToolProps) {
  const { editor } = props;
  const image = findSelectedNode(editor, "image");
  if (!image) return null;

  const { align } = image.attrs as ImageAttributes;

  return (
    <ToolButton
      {...props}
      toggled={align === "center"}
      onClick={() =>
        editor.chain().focus().setImageAlignment({ align: "center" }).run()
      }
    />
  );
}

export function ImageFloat(props: ToolProps) {
  const { editor } = props;
  const image = findSelectedNode(editor, "image");
  if (!image) return null;

  const { float } = image.attrs as ImageAttributes;

  return (
    <ToolButton
      {...props}
      toggled={!!float}
      onClick={() =>
        editor.chain().focus().setImageAlignment({ float: !float }).run()
      }
    />
  );
}

export function ImageProperties(props: ToolProps) {
  const { editor } = props;
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        <ImagePropertiesPopup
          editor={editor}
          onClose={() => setIsOpen(false)}
        />
      </ResponsivePresenter>
    </>
  );
}
