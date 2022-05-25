import { ToolProps } from "../types";
import { Dropdown } from "../components/dropdown";
import { ToolId } from ".";
import { MenuItem } from "../../components/menu/types";
import { Editor } from "@tiptap/core";
import { Box, Button, Flex, Text } from "rebass";
import { Slider } from "@rebass/forms";
import { ToolButton } from "../components/tool-button";
import { useCallback } from "react";

const defaultFontSizes = [
  8, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72, 100,
];
export function FontSize(props: ToolProps) {
  const { editor } = props;
  const { fontSize = "16px" } = editor.getAttributes("textStyle");
  const fontSizeAsNumber = parseInt(fontSize.replace("px", ""));

  const decreaseFontSize = useCallback(() => {
    return Math.max(8, fontSizeAsNumber - 1);
  }, [fontSizeAsNumber]);

  return (
    <Flex
      sx={{
        alignItems: "center",
        mr: 1,
        ":last-of-type": {
          mr: 0,
        },
      }}
    >
      <ToolButton
        toggled={false}
        title="Decrease font size"
        icon="minus"
        variant={"small"}
        onClick={() => {
          editor.chain().focus().setFontSize(`${decreaseFontSize()}px`).run();
        }}
      />
      <Text
        variant={"body"}
        sx={{ fontSize: "subBody", mx: 1, textAlign: "center" }}
        title="Reset font size"
        onClick={() => {
          editor.chain().focus().setFontSize(`16px`).run();
        }}
      >
        {fontSize}
      </Text>
      <ToolButton
        toggled={false}
        title="Increase font size"
        icon="plus"
        variant={"small"}
        onClick={() => {
          editor
            .chain()
            .focus()
            .setFontSize(`${fontSizeAsNumber + 1}px`)
            .run();
        }}
      />
    </Flex>
  );
}

const fontFamilies = {
  System: "Open Sans",
  Serif: "serif",
  Monospace: "monospace",
};
export function FontFamily(props: ToolProps) {
  const { editor } = props;

  const currentFontFamily =
    Object.entries(fontFamilies)
      .find(([key, value]) =>
        editor.isActive("textStyle", { fontFamily: value })
      )
      ?.map((a) => a)
      ?.at(0) || "System";

  return (
    <Dropdown
      selectedItem={currentFontFamily}
      items={toMenuItems(editor, currentFontFamily)}
      menuWidth={130}
    />
  );
}

function toMenuItems(editor: Editor, currentFontFamily: string): MenuItem[] {
  const menuItems: MenuItem[] = [];
  for (const key in fontFamilies) {
    const value = fontFamilies[key as keyof typeof fontFamilies];
    menuItems.push({
      key,
      type: "menuitem",
      title: key,
      isChecked: key === currentFontFamily,
      onClick: () => editor.chain().focus().setFontFamily(value).run(),
    });
  }
  return menuItems;
}
