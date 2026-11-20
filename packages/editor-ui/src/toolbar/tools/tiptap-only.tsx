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

import type { ComponentType } from "react";
import type { TiptapToolProps, ToolProps } from "../types.js";
import type { EditorController } from "../../controller.js";
import { tiptapController } from "../../tiptap-controller.js";

export function useTiptapController(props: TiptapToolProps): EditorController {
  return props.controller ?? tiptapController(props.editor);
}

export function tiptapOnly(Component: ComponentType<TiptapToolProps>) {
  function TiptapOnly(props: ToolProps) {
    const tiptap = props.editor.tiptap;
    if (!tiptap) return null;
    return <Component {...props} editor={tiptap} controller={props.editor} />;
  }
  TiptapOnly.displayName = `TiptapOnly(${
    Component.displayName || Component.name
  })`;
  return TiptapOnly;
}
