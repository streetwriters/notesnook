import React, { useState } from "react";
import tinycolor from "tinycolor2";
import { PopupWrapper } from "../../components/popup-presenter";
import { config } from "../../utils/config";
import { SplitButton } from "../components/split-button";
import { ColorPicker } from "../popups/color-picker";
import { useToolbarLocation } from "../stores/toolbar-store";
import { ToolProps } from "../types";
import { getToolbarElement } from "../utils/dom";

type ColorToolProps = ToolProps & {
  onColorChange: (color?: string) => void;
  activeColor: string;
  title: string;
  cacheKey: string;
};

export function ColorTool(props: ColorToolProps) {
  const {
    editor,
    onColorChange,
    activeColor: _activeColor,
    title,
    cacheKey,
    ...toolProps
  } = props;
  const activeColor = _activeColor || config.get(cacheKey);
  const tColor = tinycolor(activeColor);
  const isBottom = useToolbarLocation() === "bottom";
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <SplitButton
      {...toolProps}
      iconColor={activeColor && tColor.isDark() ? "static" : "icon"}
      sx={{
        mr: 0,
        bg: activeColor || "transparent",
        ":hover": {
          bg: activeColor ? tColor.darken(5).toRgbString() : "transparent",
        },
      }}
      onOpen={() => setIsOpen((s) => !s)}
      toggled={isOpen}
      onClick={() => onColorChange(activeColor)}
    >
      <PopupWrapper
        isOpen={isOpen}
        id={props.icon}
        group={"color"}
        position={{
          isTargetAbsolute: true,
          target: getToolbarElement(),
          align: isBottom ? "center" : "end",
          location: isBottom ? "top" : "below",
          yOffset: 10,
        }}
        focusOnRender={false}
        blocking={false}
        renderPopup={(close) => (
          <ColorPicker
            color={activeColor}
            onClear={() => {
              onColorChange();
              config.set(cacheKey, null);
            }}
            onChange={(color) => {
              onColorChange(color);
              config.set(cacheKey, color);
            }}
            onClose={close}
            title={title}
          />
        )}
      />
    </SplitButton>
  );
}

export function Highlight(props: ToolProps) {
  const { editor } = props;
  return (
    <ColorTool
      {...props}
      cacheKey="highlight"
      activeColor={editor.getAttributes("textStyle").backgroundColor}
      title={"Background color"}
      onColorChange={(color) =>
        color
          ? editor.current?.chain().focus().setHighlight(color).run()
          : editor.current?.chain().focus().unsetHighlight().run()
      }
    />
  );
}

export function TextColor(props: ToolProps) {
  const { editor } = props;
  return (
    <ColorTool
      {...props}
      cacheKey={"textColor"}
      activeColor={editor.getAttributes("textStyle").color}
      title="Text color"
      onColorChange={(color) =>
        color
          ? editor.current?.chain().focus().setColor(color).run()
          : editor.current?.chain().focus().unsetColor().run()
      }
    />
  );
}
