import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { useMemo, useRef, useState } from "react";
import { Popup } from "../components/popup";
import { ResponsivePresenter } from "../../components/responsive";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { ImageProperties as ImagePropertiesPopup } from "../popups/image-properties";
import {
  ImageAlignmentOptions,
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
      autoCloseOnUnmount
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
  const buttonRef = useRef<HTMLButtonElement>();

  // TODO: defer until user opens the popup
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
