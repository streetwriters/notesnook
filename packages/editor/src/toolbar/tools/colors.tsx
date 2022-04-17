import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolId } from ".";
import { Dropdown } from "../components/dropdown";
import { MenuItem } from "../../components/menu/types";
import { Box, Button, Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import { Icon } from "../components/icon";
import { IconNames, Icons } from "../icons";
import { ToolButton } from "../components/tool-button";
import { MenuPresenter } from "../../components/menu/menu";
import { useRef, useState } from "react";
import tinycolor from "tinycolor2";

export const DEFAULT_COLORS = [
  "#f44336",
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
];

class ColorTool implements ITool {
  constructor(
    readonly id: ToolId,
    readonly title: string,
    private readonly icon: IconNames,
    private readonly onColorChange: (editor: Editor, color?: string) => void
  ) {}

  render = (props: ToolProps) => {
    const { editor } = props;
    const [isOpen, setIsOpen] = useState(false);
    const attrs = editor.getAttributes(
      this.id === "highlight" ? "highlight" : "textStyle"
    );
    const ref = useRef<HTMLDivElement>(null);
    const isActive = editor.isActive(
      this.id === "highlight" ? "highlight" : "textStyle",
      { color: /\W+/gm }
    );

    return (
      <Flex ref={ref}>
        <ToolButton
          title={this.title}
          id={this.id}
          icon={this.icon}
          onClick={() => {}}
          toggled={false}
          sx={{ mr: 0, bg: isActive ? attrs.color : "transparent" }}
        />
        <Button
          sx={{
            p: 0,
            m: 0,
            bg: "transparent",
            ":hover": { bg: "hover" },
            ":last-of-type": {
              mr: 0,
            },
          }}
          onClick={() => setIsOpen((s) => !s)}
        >
          <Icon path={Icons.chevronDown} color="text" size={18} />
        </Button>
        <MenuPresenter
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          items={[]}
          // sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", p: 1 }}
          options={{
            type: "menu",
            position: {
              target: ref.current || undefined,
              isTargetAbsolute: true,
              location: "below",
              align: "center",
              yOffset: 5,
            },
          }}
        >
          <Flex
            sx={{
              flexDirection: "column",
              bg: "background",
              boxShadow: "menu",
              border: "1px solid var(--border)",
              borderRadius: "default",
              p: 1,
              width: 160,
            }}
          >
            <ColorPicker
              colors={DEFAULT_COLORS}
              color={attrs.color}
              onClear={() => this.onColorChange(editor)}
              onChange={(color) => this.onColorChange(editor, color)}
            />
          </Flex>
        </MenuPresenter>
      </Flex>
    );
  };
}

export class Highlight extends ColorTool {
  constructor() {
    super("highlight", "Highlight", "highlight", (editor, color) =>
      color
        ? editor.chain().focus().toggleHighlight({ color }).run()
        : editor.chain().focus().unsetHighlight().run()
    );
  }
}

export class TextColor extends ColorTool {
  constructor() {
    super("textColor", "Text color", "textColor", (editor, color) =>
      color
        ? editor.chain().focus().setColor(color).run()
        : editor.chain().focus().unsetColor().run()
    );
  }
}

type ColorPickerProps = {
  colors: string[];
  color: string;
  onClear: () => void;
  onChange: (color: string) => void;
};
export function ColorPicker(props: ColorPickerProps) {
  const { colors, color, onClear, onChange } = props;
  const [currentColor, setCurrentColor] = useState<string>(
    tinycolor(color || colors[0]).toHexString()
  );

  return (
    <>
      <Flex
        sx={{
          width: "100%",
          height: 50,
          bg: currentColor,
          mb: 1,
          borderRadius: "default",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          sx={{
            fontSize: "subheading",
            color: tinycolor(currentColor).isDark() ? "white" : "black",
          }}
        >
          {currentColor}
        </Text>
      </Flex>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
        }}
      >
        {colors.map((color) => (
          <Box
            sx={{
              bg: color,
              width: 25,
              height: 25,
              m: "2px",
              borderRadius: "default",
              cursor: "pointer",
              ":hover": {
                filter: "brightness(85%)",
              },
            }}
            onClick={() => {
              setCurrentColor(color);
              onChange(color);
            }}
          />
        ))}
        <Flex
          sx={{
            width: 25,
            height: 25,
            m: "2px",
            borderRadius: "default",
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center",
            ":hover": {
              filter: "brightness(85%)",
            },
          }}
          onClick={onClear}
        >
          <Icon path={Icons.colorClear} size={18} />
        </Flex>
      </Box>
      <Flex
        sx={{
          mt: 1,
          borderRadius: "default",
        }}
      >
        <Input
          placeholder="#000000"
          sx={{
            p: 1,
            m: 0,
            fontSize: "body",
            border: "none",
            borderWidth: 0,
          }}
          value={currentColor}
          maxLength={7}
          onChange={(e) => {
            const { value } = e.target;
            if (!value) return;
            setCurrentColor(value);
          }}
        />
        <Button
          sx={{
            bg: "transparent",
            p: 1,
            ":hover": { bg: "hover" },
            cursor: "pointer",
          }}
          onClick={() => onChange(currentColor)}
        >
          <Icon path={Icons.check} color="text" size={18} />
        </Button>
      </Flex>
    </>
  );
}
