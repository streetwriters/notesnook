import { ToolProps } from "../types";
import { Dropdown } from "../components/dropdown";
import { MenuItem } from "../../components/menu/types";
import { Editor } from "@tiptap/core";
import { useCallback, useEffect } from "react";
import { Counter } from "../components/counter";

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
    <Counter
      title="font size"
      onDecrease={() =>
        editor.chain().focus().setFontSize(`${decreaseFontSize()}px`).run()
      }
      onIncrease={() =>
        editor
          .chain()
          .focus()
          .setFontSize(`${fontSizeAsNumber + 1}px`)
          .run()
      }
      onReset={() => editor.chain().focus().setFontSize(`16px`).run()}
      value={fontSize}
    />
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
      type: "button",
      title: key,
      isChecked: key === currentFontFamily,
      onClick: () => editor.chain().focus().setFontFamily(value).run(),
    });
  }
  return menuItems;
}
