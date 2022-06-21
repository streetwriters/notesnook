import { Editor } from "@tiptap/core";
import { useState } from "react";
import tinycolor from "tinycolor2";
import { PopupWrapper } from "../../components/popup-presenter";
import { config } from "../../utils/config";
import { SplitButton } from "../components/split-button";
import { ColorPicker } from "../popups/color-picker";
import { useToolbarLocation } from "../stores/toolbar-store";
import { ToolProps } from "../types";
import { getToolbarElement } from "../utils/dom";

type ColorToolProps = ToolProps & {
  onColorChange: (editor: Editor, color?: string) => void;
  getActiveColor: (editor: Editor) => string;
  title: string;
  cacheKey: string;
};
export function ColorTool(props: ColorToolProps) {
  const {
    editor,
    onColorChange,
    getActiveColor,
    title,
    cacheKey,
    ...toolProps
  } = props;
  const activeColor = getActiveColor(editor) || config.get(cacheKey);
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
      onClick={() => onColorChange(editor, activeColor)}
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
              onColorChange(editor);
              config.set(cacheKey, null);
            }}
            onChange={(color) => {
              onColorChange(editor, color);
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
  return (
    <ColorTool
      {...props}
      cacheKey="highlight"
      getActiveColor={(editor) => editor.getAttributes("highlight").color}
      title={"Background color"}
      onColorChange={(editor, color) =>
        color
          ? editor.chain().focus().toggleHighlight({ color }).run()
          : editor.chain().focus().unsetHighlight().run()
      }
    />
  );
}

export function TextColor(props: ToolProps) {
  return (
    <ColorTool
      {...props}
      cacheKey={"textColor"}
      getActiveColor={(editor) => editor.getAttributes("textStyle").color}
      title="Text color"
      onColorChange={(editor, color) =>
        color
          ? editor.chain().focus().setColor(color).run()
          : editor.chain().focus().unsetColor().run()
      }
    />
  );
}
