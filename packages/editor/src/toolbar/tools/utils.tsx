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

import { Editor } from "../../types.js";
import { MenuButtonItem } from "@notesnook/ui";
import { ToolButton } from "../components/tool-button.js";
import { ToolDefinition, ToolProps } from "../types.js";
import { IconNames, Icons } from "../icons.js";

export function menuButtonToTool(
  constructItem: (editor: Editor) => MenuButtonItem
) {
  return function Tool(props: ToolProps & { icon: IconNames }) {
    const item = constructItem(props.editor);
    return (
      <ToolButton
        {...props}
        icon={props.icon}
        toggled={item.isChecked || false}
        title={item.title}
        onClick={item.onClick}
      />
    );
  };
}

export function toolToMenuButton(tool: ToolDefinition): MenuButtonItem {
  return {
    ...tool,
    type: "button",
    icon: Icons[tool.icon],
    key: tool.title
  };
}
