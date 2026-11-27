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

// The theme listing's type. Web imports it from @notesnook/themes-server, a
// server package desktop-native does not depend on.

import type { getPreviewColors } from "@notesnook/theme";

export type ThemeMetadata = {
  id: string;
  name: string;
  version: string;
  description: string;
  authors: { name: string }[];
  totalInstalls?: number;
  license: string;
  homepage?: string;
  sourceURL?: string;
  colorScheme?: "dark" | "light";
  previewColors: ReturnType<typeof getPreviewColors>;
};
