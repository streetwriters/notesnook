import { ITool, ToolProps } from "../types";
import { Dropdown } from "../components/dropdown";
import { ToolId } from ".";
import { MenuItem } from "../../components/menu/types";
import { Editor } from "@tiptap/core";

export class FontSize implements ITool {
  title = "Font size";
  id: ToolId = "fontSize";
  private defaultFontSizes = [
    12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72, 100,
  ];

  render = (props: ToolProps) => {
    const { editor } = props;
    const currentFontSize =
      this.defaultFontSizes.find((size) =>
        editor.isActive("textStyle", { fontSize: `${size}px` })
      ) || 16;

    return (
      <Dropdown
        selectedItem={`${currentFontSize}px`}
        items={this.defaultFontSizes.map((size) => ({
          key: `${size}px`,
          type: "menuitem",
          title: `${size}px`,
          isChecked: size === currentFontSize,
          onClick: () => editor.chain().focus().setFontSize(`${size}px`).run(),
        }))}
      />
    );
  };
}

export class FontFamily implements ITool {
  title = "Font family";
  id: ToolId = "fontFamily";
  private fontFamilies = {
    System: "Open Sans",
    Serif: "serif",
    Monospace: "monospace",
  };

  render = (props: ToolProps) => {
    const { editor } = props;

    const currentFontFamily =
      Object.entries(this.fontFamilies)
        .find(([key, value]) =>
          editor.isActive("textStyle", { fontFamily: value })
        )
        ?.map((a) => a)
        ?.at(0) || "System";

    return (
      <Dropdown
        selectedItem={currentFontFamily}
        items={this.toMenuItems(editor, currentFontFamily)}
      />
    );
  };

  private toMenuItems(editor: Editor, currentFontFamily: string): MenuItem[] {
    const menuItems: MenuItem[] = [];
    for (const key in this.fontFamilies) {
      const value = this.fontFamilies[key as keyof typeof this.fontFamilies];
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
}
