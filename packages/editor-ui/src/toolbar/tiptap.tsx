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

import type { AnyEditor } from "../controller.js";
import { toController } from "../tiptap-controller.js";
import { ControllerToolbar, type ControllerToolbarProps } from "./toolbar.js";
import {
  ControllerToolbarGroup,
  type ControllerToolbarGroupProps
} from "./components/toolbar-group.js";
import { EditorFloatingMenus } from "./floating-menus/index.js";

export type ToolbarProps = Omit<ControllerToolbarProps, "editor"> & {
  editor: AnyEditor;
};

export function Toolbar(props: ToolbarProps) {
  const editor = toController(props.editor);
  return (
    <ControllerToolbar
      {...props}
      editor={editor}
      floatingMenus={
        editor.tiptap ? (
          <EditorFloatingMenus editor={editor.tiptap} controller={editor} />
        ) : null
      }
    />
  );
}

export type ToolbarGroupProps = Omit<ControllerToolbarGroupProps, "editor"> & {
  editor: AnyEditor;
};

export function ToolbarGroup(props: ToolbarGroupProps) {
  return (
    <ControllerToolbarGroup {...props} editor={toController(props.editor)} />
  );
}
