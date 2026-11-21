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

import { useRef, useState } from "react";
import { Flex } from "@ui";
import { strings } from "@notesnook/intl";
import { q } from "../../queries/queries.js";
import { useControllerQuery as useEditorQuery } from "../../queries/use-query.js";
import type { ToolProps } from "../types.js";
import type { EditorController } from "../../controller.js";
import { ToolButton } from "../components/tool-button.js";
import { MoreTools } from "../components/more-tools.js";
import { Popup } from "../components/popup.js";
import { InlineInput } from "../../components/inline-input/index.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import {
  imageRatio,
  setImageAlignmentCommand,
  setImageSizeCommand,
  sizeForHeight,
  sizeForWidth,
  type ImageDimensions
} from "../popups/image-size.js";

type Align = "left" | "center" | "right";

type ImageAttrs = ImageDimensions & { align?: Align };

/** The image the caret or selection is on, or null (these tools hide). */
function useImage(editor: EditorController): ImageAttrs | null {
  return useEditorQuery(editor, q.selectedNode("image"), null) as ImageAttrs | null;
}

export function ImageSettings(props: ToolProps) {
  const { editor } = props;
  const isImage = useEditorQuery(editor, q.isActive("image"), false);
  const isEditable = useEditorQuery(editor, q.editable(), true);

  // The Tiptap editor shows these tools on a floating bar over the image on
  // desktop, so its `imageSettings` is bottom-toolbar only. The native editor
  // has no such bar: the tools live behind this button on every toolbar.
  if (!isImage) return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="imageSettings"
      tools={
        isEditable
          ? [
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

function alignTool(align: Align) {
  return function ImageAlign(props: ToolProps) {
    const { editor } = props;
    const image = useImage(editor);
    if (!image) return null;
    const current = image.align;
    return (
      <ToolButton
        icon={props.icon}
        title={props.title}
        toggled={align === "left" ? !current || current === "left" : current === align}
        onClick={() => editor.run(setImageAlignmentCommand(align))}
      />
    );
  };
}

export const ImageAlignLeft = alignTool("left");
export const ImageAlignCenter = alignTool("center");
export const ImageAlignRight = alignTool("right");

export type ImagePropertiesPopupProps = {
  editor: EditorController;
  onClose: () => void;
};

/**
 * Width and height of the selected image. Typing in one field resizes the
 * other to keep the image's proportions, like the Tiptap popup.
 */
export function ImagePropertiesPopup(props: ImagePropertiesPopupProps) {
  const { editor, onClose } = props;
  const image = useImage(editor);
  // The proportions the image had when the popup opened: each keystroke
  // resizes the image, and a ratio re-read from the rounded size would drift.
  const ratio = useRef<number | null>(null);
  // What the user is typing in a field, so it isn't rewritten under them
  // ("1", "12", "120"); the other field follows the image.
  const [typing, setTyping] = useState<{
    field: "width" | "height";
    text: string;
  } | null>(null);
  if (!image) return null;
  ratio.current ??= imageRatio(image);

  return (
    <Popup title={strings.imageProperties()} onClose={onClose}>
      <Flex sx={{ width: ["auto", 300], alignItems: "center", p: 1 }}>
        <InlineInput
          label={strings.width()}
          type="number"
          value={
            typing?.field === "width" ? typing.text : String(image.width || 0)
          }
          containerProps={{ sx: { mr: 1 } }}
          onChangeText={(text) => {
            setTyping({ field: "width", text });
            const size = sizeForWidth(image, text, ratio.current ?? 0);
            if (size) editor.run(setImageSizeCommand(size));
          }}
          onBlur={() => setTyping(null)}
        />
        <InlineInput
          label={strings.height()}
          type="number"
          value={
            typing?.field === "height"
              ? typing.text
              : String(image.height || 0)
          }
          onChangeText={(text) => {
            setTyping({ field: "height", text });
            const size = sizeForHeight(image, text, ratio.current ?? 0);
            if (size) editor.run(setImageSizeCommand(size));
          }}
          onBlur={() => setTyping(null)}
        />
      </Flex>
    </Popup>
  );
}

export function ImageProperties(props: ToolProps) {
  const { editor } = props;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ToolButton
        toggled={isOpen}
        icon={props.icon}
        title={props.title}
        onClick={() => setIsOpen((s) => !s)}
      />
      <ResponsivePresenter
        isOpen={isOpen}
        desktop="popup"
        mobile="sheet"
        onClose={() => setIsOpen(false)}
        blocking
        focusOnRender={false}
        editor={editor}
        anchor={{ node: "image" }}
        placement="bottom-start"
      >
        <ImagePropertiesPopup
          editor={editor}
          onClose={() => setIsOpen(false)}
        />
      </ResponsivePresenter>
    </>
  );
}
