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

import { forwardRef, useImperativeHandle } from "react";
import type * as Contract from "../../../ui/editor";
import { Flex } from "./primitives";

const handle: Contract.EditorHandle = {
  focus: () => {},
  undo: () => {},
  redo: () => {},
  updateContent: () => {},
  getContent: () => "",
  getSelection: () => ({ from: 0, to: 0 }),
  attachFiles: () => {},
  sendAttachmentProgress: () => {},
  startSearch: () => {},
  scrollToHeading: () => {}
};

export const EditorSurface = forwardRef<
  Contract.EditorHandle,
  Contract.EditorSurfaceProps
>(function EditorSurface(props, ref) {
  useImperativeHandle(ref, () => handle, []);
  return (
    <Flex
      testID={props.testID ?? "editor-body"}
      sx={{ flex: 1, ...props.sx }}
    />
  );
});
