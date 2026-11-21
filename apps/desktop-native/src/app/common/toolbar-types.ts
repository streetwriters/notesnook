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

// The toolbar's tools, icons and presets are plain data owned by
// `@notesnook/editor-ui` (`toolbar-data`); mobile reads the same data. These
// files only re-export it, so there is one list to keep in step.
import type {
  ToolbarDefinition,
  ToolbarGroupDefinition,
  ToolId
} from "@notesnook/editor-ui/toolbar-data/index.js";
import type { IconNames } from "./toolbar-icons";

export type { ToolbarDefinition, ToolbarGroupDefinition, ToolId };

export type ToolDefinition = {
  icon: IconNames;
  title: string;
  conditional?: boolean;
  description?: string;
};
