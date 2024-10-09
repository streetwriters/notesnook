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
import {
  ToolbarLocation,
  useToolbarLocation
} from "../stores/toolbar-store.js";
import { useMemo } from "react";
import { CodeBlock } from "../../extensions/code-block/index.js";
import { strings } from "@notesnook/intl";

const defaultLevels = [1, 2, 3, 4, 5, 6] as const;

export function Headings(props: ToolProps) {
  const { editor } = props;
  const toolbarLocation = useToolbarLocation();

  const currentHeadingLevel = defaultLevels.find((level) =>
    editor.isActive("heading", { level })
  );
  const items = useMemo(
    () => toMenuItems(editor, toolbarLocation, currentHeadingLevel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentHeadingLevel, toolbarLocation]
  );

  return (
    <Dropdown
      id="headings"
      group="headings"
      selectedItem={
        currentHeadingLevel
          ? strings.heading(currentHeadingLevel)
          : strings.paragraph()
      }
      items={items}
      menuWidth={130}
      disabled={editor.isActive(CodeBlock.name)}
    />
  );
}

function toMenuItems(
  editor: Editor,
  toolbarLocation: ToolbarLocation,
  currentHeadingLevel?: number
): MenuItem[] {
  const menuItems: MenuItem[] = defaultLevels.map((level) => ({
    type: "button",
    key: `heading-${level}`,
    title: toolbarLocation === "bottom" ? `H${level}` : strings.heading(level),
    isChecked: level === currentHeadingLevel,
    modifier: `Mod-Alt-${level}`,
    onClick: () =>
      editor
        ?.chain()
        .focus()
        .updateAttributes("textStyle", { fontSize: null, fontStyle: null })
        .setHeading({ level })
        .run()
  }));
  const paragraph: MenuItem = {
    key: "paragraph",
    type: "button",
    title: strings.paragraph(),
    isChecked: !currentHeadingLevel,
    modifier: `Mod-Alt-0`,
    onClick: () => editor.chain().focus().setParagraph().run()
  };
  return [paragraph, ...menuItems];
}
