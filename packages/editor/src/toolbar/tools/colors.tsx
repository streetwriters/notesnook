import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { Box, Button, Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import { Icon } from "../components/icon";
import { Icons } from "../icons";
import { ToolButton } from "../components/tool-button";
import { SplitButton } from "../components/split-button";
import { MenuPresenter } from "../../components/menu/menu";
import { useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { HexColorPicker, HexColorInput } from "react-colorful";

export const DEFAULT_COLORS = [
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#f44336",
];
type ColorToolProps = ToolProps & {
  onColorChange: (editor: Editor, color?: string) => void;
  isActive: (editor: Editor) => boolean;
  getActiveColor: (editor: Editor) => string;
};
function ColorTool(props: ColorToolProps) {
  const { editor, onColorChange, isActive, getActiveColor, ...toolProps } =
    props;
  const activeColor = getActiveColor(editor);
  const _isActive = isActive(editor);
  const tColor = tinycolor(activeColor);

  return (
    <SplitButton
      {...toolProps}
      toggled={false}
      iconColor={_isActive && tColor.isDark() ? "static" : "icon"}
      sx={{
        mr: 0,
        bg: _isActive ? activeColor : "transparent",
        ":hover": {
          bg: _isActive ? tColor.darken(5).toRgbString() : "transparent",
        },
      }}
      popupPresenterProps={{
        mobile: "sheet",
        desktop: "menu",
      }}
    >
      <Flex
        sx={{
          bg: "background",
          width: ["auto", "auto", 250],
          flexDirection: "column",
          p: [3, 3, 2],
          boxShadow: ["none", "none", "menu"],
          borderRadius: ["none", "none", "dialog"],
          ".react-colorful": {
            width: "auto",
            height: 150,
          },
        }}
      >
        <ColorPicker
          colors={DEFAULT_COLORS}
          color={activeColor}
          onClear={() => onColorChange(editor)}
          onChange={(color) => onColorChange(editor, color)}
        />
      </Flex>
    </SplitButton>
  );
}

export function Highlight(props: ToolProps) {
  return (
    <ColorTool
      {...props}
      isActive={(editor) => editor.isActive("highlight", { color: /\W+/gm })}
      getActiveColor={(editor) => editor.getAttributes("highlight").color}
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
      isActive={(editor) => editor.isActive("textStyle", { color: /\W+/gm })}
      getActiveColor={(editor) => editor.getAttributes("textStyle").color}
      onColorChange={(editor, color) =>
        color
          ? editor.chain().focus().setColor(color).run()
          : editor.chain().focus().unsetColor().run()
      }
    />
  );
}

type ColorPickerProps = {
  colors: string[];
  color: string;
  onClear: () => void;
  onChange: (color: string) => void;
};
const PALETTE_SIZE = [35, 35, 25];
export function ColorPicker(props: ColorPickerProps) {
  const { colors, color, onClear, onChange } = props;
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const tColor = tinycolor(color || colors[0]);
  const [currentColor, setCurrentColor] = useState<string>(
    tColor.toHexString()
  );

  return (
    <>
      {isPickerOpen && (
        <HexColorPicker color={currentColor} onChange={onChange} />
      )}
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          mt: isPickerOpen ? 2 : 0,
        }}
      >
        <Button
          variant={"secondary"}
          sx={{
            flexShrink: 0,
            bg: currentColor,
            width: PALETTE_SIZE,
            height: PALETTE_SIZE,
            mr: 2,
            borderRadius: 50,
            boxShadow: "menu",
            p: 0,
          }}
          onClick={() => setIsPickerOpen((s) => !s)}
        >
          <Icon
            path={Icons.palette}
            color={tColor.isDark() ? "static" : "icon"}
            size={18}
          />
        </Button>
        <Input
          variant={"clean"}
          placeholder="#000000"
          spellCheck={false}
          sx={{
            p: 0,
            borderRadius: 0,
            fontSize: ["title", "title", "body"],
            color: "fontTertiary",
            textAlign: "left",
            letterSpacing: 1.5,
          }}
          value={currentColor.toUpperCase()}
          maxLength={7}
          onChange={(e) => {
            const { value } = e.target;
            if (!value) return;
            setCurrentColor(value);
          }}
        />
        <Button
          variant={"icon"}
          sx={{
            flexShrink: 0,
            bg: "transparent",
            width: PALETTE_SIZE,
            height: PALETTE_SIZE,
            mr: 2,
            borderRadius: 50,
            p: 0,
          }}
          onClick={onClear}
        >
          <Icon path={Icons.colorClear} color="text" size={15} />
        </Button>
      </Flex>
      <Flex
        sx={{
          borderTop: "1px solid var(--border)",
          mt: 2,
          pt: 4,
          flexWrap: "wrap",
        }}
      >
        {colors.map((color) => (
          <Button
            variant={"secondary"}
            sx={{
              bg: color,
              width: PALETTE_SIZE,
              height: PALETTE_SIZE,
              ml: [2, 2, 1],
              mb: [2, 2, 1],
              borderRadius: 50,
              boxShadow: "menu",
            }}
            onClick={() => {
              setCurrentColor(color);
              onChange(color);
            }}
          />
        ))}
      </Flex>
    </>
  );
}
