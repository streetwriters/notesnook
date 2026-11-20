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

import { useMemo } from "react";
import type { ThemeDefinition } from "@notesnook/theme";
import { createThemeContext, useThemeContext } from "./theme";

export interface EditorThemeTokens {
  colorScheme: "light" | "dark";
  surface: string;
  text: string;
  prefix: string;
  selection: string;
  link: string;
  rule: string;
  quoteBar: string;
  attachmentBg: string;
  attachmentBorder: string;
  codeBg: string;
  codeBorder: string;
  chevron: string;
  searchMatch: string;
  searchMatchCurrent: string;
  spellError: string;
  toolbarBg: string;
  toolbarText: string;
  toolbarButtonBg: string;
  toolbarButtonActiveBg: string;
  toolbarButtonActiveText: string;
  toolbarSeparator: string;
}

export function useEditorThemeTokens(): EditorThemeTokens {
  const { definition } = useThemeContext();
  return useMemo(() => createEditorThemeTokens(definition), [definition]);
}

export function createEditorThemeTokens(
  definition: ThemeDefinition
): EditorThemeTokens {
  const toolbar = createThemeContext(definition, "editorToolbar").colors;
  const c = createThemeContext(definition, "editor").colors;
  return {
    colorScheme: definition.colorScheme,
    surface: c.background,
    text: c.paragraph,
    prefix: c.icon,
    selection: c.textSelection ?? `${c.accent}40`,
    link: c.accent,
    rule: c.separator,
    quoteBar: c.accent,
    attachmentBg: c["background-secondary"],
    attachmentBorder: c.border,
    codeBg: c["background-secondary"],
    codeBorder: c.border,
    chevron: c.icon,
    searchMatch: c.shade,
    searchMatchCurrent: c.accent,
    spellError: c.error ?? c.red,
    toolbarBg: toolbar.background,
    toolbarText: toolbar.icon,
    toolbarButtonBg: toolbar["background-secondary"] ?? toolbar.hover,
    toolbarButtonActiveBg: toolbar.shade,
    toolbarButtonActiveText: toolbar.accent,
    toolbarSeparator: toolbar.separator
  };
}
