import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { useCallback, useMemo, useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import { Popup } from "../components/popup";
import { ResponsivePresenter } from "../../components/responsive";
import { MenuButton, MenuItem } from "../../components/menu/types";
import {
  moveColumnLeft as moveColumnLeftAction,
  moveColumnRight as moveColumnRightAction,
  moveRowDown as moveRowDownAction,
  moveRowUp as moveRowUpAction,
} from "../floatingmenus/table/actions";
import { MoreTools } from "../components/more-tools";
import { menuButtonToTool } from "./utils";
import { getToolDefinition } from "../tool-definitions";
import { CellProperties as CellPropertiesPopup } from "../popups/cell-properties";
import { ColorTool } from "./colors";
import { Counter } from "../components/counter";
import { useToolbarLocation } from "../stores/toolbar-store";
import { showPopup } from "../../components/popup-presenter";
import { ImageProperties as ImagePropertiesPopup } from "../popups/image-properties";
import {
  ImageAlignmentOptions,
  ImageAttributes,
  ImageSizeOptions,
} from "../../extensions/image";
import { findSelectedNode } from "../utils/prosemirror";

export function ImageSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("image") || !isBottom) return null;

  const image = useMemo(() => findSelectedNode(editor, "image"), []);
  const { float } = (image?.attrs || {}) as ImageAlignmentOptions &
    ImageSizeOptions;

  return (
    <MoreTools
      {...props}
      popupId="imageSettings"
      tools={
        float
          ? ["imageAlignLeft", "imageAlignRight", "imageProperties"]
          : [
              "imageAlignLeft",
              "imageAlignCenter",
              "imageAlignRight",
              "imageProperties",
            ]
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
        editor.chain().focus().setImageAlignment({ align: "left" }).run()
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
        editor.chain().focus().setImageAlignment({ align: "right" }).run()
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
        editor.chain().focus().setImageAlignment({ align: "center" }).run()
      }
    />
  );
}

export function ImageProperties(props: ToolProps) {
  const { editor } = props;
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>();

  const image = useMemo(() => findSelectedNode(editor, "image"), []);
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
          isTargetAbsolute: true,
        }}
      >
        <Popup
          title="Image properties"
          onClose={() => {
            setIsOpen(false);
          }}
        >
          <ImagePropertiesPopup
            editor={editor}
            height={height}
            width={width}
            align={align}
            float={float}
          />
        </Popup>
      </ResponsivePresenter>
    </>
  );
}
