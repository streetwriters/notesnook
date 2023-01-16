/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { ToolProps } from "../types";
import { Editor } from "../../types";
import { Dropdown } from "../components/dropdown";
import { MenuItem } from "../../components/menu/types";
import { useCallback, useMemo } from "react";
import { Counter } from "../components/counter";
import { useRefValue } from "../../hooks/use-ref-value";

export function FontSize(props: ToolProps) {
  const { editor } = props;
  const { fontSize: _fontSize } = editor.getAttributes("textStyle");
  const fontSize = _fontSize || "16px";
  const fontSizeAsNumber = useRefValue(parseInt(fontSize.replace("px", "")));

  const decreaseFontSize = useCallback(() => {
    return Math.max(8, fontSizeAsNumber.current - 1);
  }, [fontSizeAsNumber]);

  const increaseFontSize = useCallback(() => {
    return Math.min(120, fontSizeAsNumber.current + 1);
  }, [fontSizeAsNumber]);

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
      onReset={() => editor.current?.chain().focus().setFontSize("16px").run()}
      value={fontSize}
    />
  );
}

const fontFamilies = {
  "Sans-serif": "Open Sans",
  Serif: "serif",
  Monospace: "monospace"
};
export function FontFamily(props: ToolProps) {
  const { editor } = props;

  const currentFontFamily =
    Object.entries(fontFamilies)
      .find(([_key, value]) =>
        editor.isActive("textStyle", { fontFamily: value })
      )
      ?.map((a) => a)
      ?.at(0) || "Sans-serif";
  const items = useMemo(
    () => toMenuItems(editor, currentFontFamily),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentFontFamily]
  );

  return (
    <Dropdown
      id="fontFamily"
      group="font"
      selectedItem={currentFontFamily}
      items={items}
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
      onClick: () => editor.current?.chain().focus().setFontFamily(value).run(),
      styles: {
        fontFamily: value
      }
    });
  }
  return menuItems;
}
