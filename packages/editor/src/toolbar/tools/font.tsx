import { ToolProps } from "../types";
import { Dropdown } from "../components/dropdown";
import { ToolId } from ".";
import { MenuItem } from "../../components/menu/types";
import { Editor } from "@tiptap/core";

const defaultFontSizes = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72, 100,
];
export function FontSize(props: ToolProps) {
  const { editor } = props;
  const currentFontSize =
    defaultFontSizes.find((size) =>
      editor.isActive("textStyle", { fontSize: `${size}px` })
    ) || 16;

  return (
    <Dropdown
      selectedItem={`${currentFontSize}px`}
      items={defaultFontSizes.map((size) => ({
        key: `${size}px`,
        type: "menuitem",
        title: `${size}px`,
        isChecked: size === currentFontSize,
        onClick: () => editor.chain().focus().setFontSize(`${size}px`).run(),
      }))}
      menuWidth={100}
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
      type: "menuitem",
      title: key,
      isChecked: key === currentFontFamily,
      onClick: () => editor.chain().focus().setFontFamily(value).run(),
    });
  }
  return menuItems;
}
