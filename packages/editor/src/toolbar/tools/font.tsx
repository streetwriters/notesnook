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

import { ToolProps } from "../types.js";
import { Editor } from "../../types.js";
import { Dropdown } from "../components/dropdown.js";
import { MenuItem } from "@notesnook/ui";
import { useCallback, useMemo } from "react";
import { Counter } from "../components/counter.js";
import { useRefValue } from "../../hooks/use-ref-value.js";
import { useToolbarStore } from "../stores/toolbar-store.js";
import { getFontById, getFontIds, getFonts } from "../../utils/font.js";
import { CodeBlock } from "../../extensions/code-block/index.js";
import { strings } from "@notesnook/intl";

export function FontSize(props: ToolProps) {
  const { editor } = props;
  const defaultFontSize = useToolbarStore((store) => store.fontSize);
  const { fontSize } = editor.getAttributes("textStyle");
  const fontSizeAsNumber = useRefValue(
    fontSize ? parseInt(fontSize.replace("px", "")) || 16 : defaultFontSize
  );

  const decreaseFontSize = useCallback(() => {
    return Math.max(8, fontSizeAsNumber.current - 1);
  }, [fontSizeAsNumber]);

  const increaseFontSize = useCallback(() => {
    return Math.min(120, fontSizeAsNumber.current + 1);
  }, [fontSizeAsNumber]);

  return (
    <Counter
      title={strings.fontSize()}
      disabled={editor.isActive(CodeBlock.name)}
      onDecrease={() =>
        editor.chain().focus().setFontSize(`${decreaseFontSize()}px`).run()
      }
      onIncrease={() => {
        editor.chain().focus().setFontSize(`${increaseFontSize()}px`).run();
      }}
      onReset={() =>
        editor.chain().focus().setFontSize(`${defaultFontSize}px`).run()
      }
      value={fontSize || `${defaultFontSize}px`}
    />
  );
}

export function FontFamily(props: ToolProps) {
  const { editor } = props;
  const defaultFontFamily = useToolbarStore((store) => store.fontFamily);
  const currentFontFamily =
    getFontIds().find((id) =>
      editor.isActive("textStyle", { fontFamily: id })
    ) || defaultFontFamily;

  const items = useMemo(
    () => toMenuItems(editor, currentFontFamily),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentFontFamily]
  );

  return (
    <Dropdown
      id="fontFamily"
      group="font"
      selectedItem={getFontById(currentFontFamily)?.title || defaultFontFamily}
      items={items}
      menuWidth={130}
      disabled={editor.isActive(CodeBlock.name)}
    />
  );
}

function toMenuItems(editor: Editor, currentFontFamily: string): MenuItem[] {
  const menuItems: MenuItem[] = [];
  for (const font of getFonts()) {
    menuItems.push({
      key: font.id,
      type: "button",
      title: font.title,
      isChecked: font.id === currentFontFamily,
      onClick: () => editor.chain().focus().setFontFamily(font.id).run(),
      styles: {
        title: {
          fontFamily: font.font
        }
      }
    });
  }
  return menuItems;
}
