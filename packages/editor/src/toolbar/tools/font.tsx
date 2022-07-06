import { ToolProps } from "../types";
import { Editor } from "../../types";
import { Dropdown } from "../components/dropdown";
import { MenuItem } from "../../components/menu/types";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Counter } from "../components/counter";
import { useRefValue } from "../../hooks/use-ref-value";

export function FontSize(props: ToolProps) {
  const { editor } = props;
  const { fontSize: _fontSize } = editor.getAttributes("textStyle");
  const fontSize = _fontSize || "16px";
  const fontSizeAsNumber = useRefValue(parseInt(fontSize.replace("px", "")));

  const decreaseFontSize = useCallback(() => {
    return Math.max(8, fontSizeAsNumber.current - 1);
  }, []);

  const increaseFontSize = useCallback(() => {
    return Math.min(120, fontSizeAsNumber.current + 1);
  }, []);

  return (
    <Counter
      title="font size"
      onDecrease={() =>
        editor.current
          ?.chain()
          .focus()
          .setFontSize(`${decreaseFontSize()}px`)
          .run()
      }
      onIncrease={() => {
        editor.current
          ?.chain()
          .focus()
          .setFontSize(`${increaseFontSize()}px`)
          .run();
      }}
      onReset={() => editor.current?.chain().focus().setFontSize(`16px`).run()}
      value={fontSize}
    />
  );
}

const fontFamilies = {
  "Sans-serif": "Open Sans",
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
      ?.at(0) || "Sans-serif";
  const items = useMemo(
    () => toMenuItems(editor, currentFontFamily),
    [currentFontFamily]
  );

  return (
    <Dropdown selectedItem={currentFontFamily} items={items} menuWidth={130} />
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
      onClick: () => editor.current?.chain().focus().setFontFamily(value).run(),
    });
  }
  return menuItems;
}
