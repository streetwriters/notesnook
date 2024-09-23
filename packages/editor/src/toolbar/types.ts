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

import { Editor } from "../types.js";
import { IconNames } from "./icons.js";
import { ToolId } from "./tools/index.js";

export type ToolButtonVariant = "small" | "normal";
export type ToolProps = ToolDefinition & {
  editor: Editor;
  variant?: ToolButtonVariant;
  force?: boolean;
  parentGroup?: string;
};

export type ToolDefinition = {
  icon: IconNames;
  title: string;
  conditional?: boolean;
  description?: string;
};

export type ToolbarGroupDefinition = (ToolId | ToolId[])[];

export type ToolbarDefinition = ToolbarGroupDefinition[];
