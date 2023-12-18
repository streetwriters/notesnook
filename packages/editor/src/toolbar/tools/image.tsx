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

import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { ImageProperties as ImagePropertiesPopup } from "../popups/image-properties";
import {
  ImageAlignmentOptions,
  ImageSizeOptions
} from "../../extensions/image";
import { findSelectedNode } from "../../utils/prosemirror";

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
          ? findSelectedNode(editor, "image")?.attrs?.float
            ? [
                "downloadAttachment",
                "imageAlignLeft",
                "imageAlignRight",
                "imageProperties"
              ]
            : [
                "downloadAttachment",
                "imageAlignLeft",
                "imageAlignCenter",
                "imageAlignRight",
                "imageProperties"
              ]
          : ["downloadAttachment"]
      }
    />
  );
}

export function ImageAlignLeft(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .setImageAlignment({ align: "left" })
          .run()
      }
    />
  );
}

export function ImageAlignRight(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .setImageAlignment({ align: "right" })
          .run()
      }
    />
  );
}

export function ImageAlignCenter(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .setImageAlignment({ align: "center" })
          .run()
      }
    />
  );
}

export function ImageProperties(props: ToolProps) {
  const { editor } = props;
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // TODO: defer until user opens the popup
  const image = findSelectedNode(editor, "image");
  const { float, align, width, height } = (image?.attrs ||
    {}) as ImageAlignmentOptions & ImageSizeOptions;

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
        desktop="menu"
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
          height={height}
          width={width}
          align={align}
          float={float}
          onClose={() => setIsOpen(false)}
        />
      </ResponsivePresenter>
    </>
  );
}
