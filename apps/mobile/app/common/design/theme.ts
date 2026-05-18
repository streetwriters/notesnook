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

import { ThemeDefinition } from "@notesnook/theme";

export const THEME_LIGHT: ThemeDefinition = {
  $schema:
    "https://raw.githubusercontent.com/streetwriters/notesnook-themes/main/schemas/v1.schema.json",
  name: "Notesnook Light",
  id: "default-light",
  version: 2.1,
  license: "GPL-3.0-or-later",
  homepage: "https://notesnook.com",
  description: "The default light theme for Notesnook app.",
  colorScheme: "light",
  codeBlockCSS: ``,
  compatibilityVersion: 1,
  authors: [
    {
      name: "Streetwriters",
      email: "support@streetwriters.co",
      url: "https://streetwriters.co"
    }
  ],
  scopes: {
    base: {
      primary: {
        accent: "#008836",
        accentForeground: "#ffffff",
        paragraph: "#666666",
        background: "#ffffff",
        border: "#E2E2E2",
        heading: "#181818",
        icon: "#181818",
        separator: "#F0F0F0",
        placeholder: "#a9a9a9",
        hover: "#eee",
        backdrop: "#0000001a",
        buttonForeground: "#FFFFFF"
      },
      secondary: {
        accent: "#7FC39A",
        accentForeground: "#ffffff",
        paragraph: "#858585",
        background: "#F7F7F7",
        border: "#EFEFEF",
        heading: "#4B4B4B",
        icon: "#666666",
        separator: "#E8E8E8",
        placeholder: "#a9a9a9",
        hover: "#dbdbdb",
        backdrop: "#0000001a",
        buttonForeground: "#181818"
      },
      tertiary: {
        accent: "#008836",
        accentForeground: "#ffffff",
        paragraph: "#777",
        background: "#ECECEC",
        border: "#E8E8E8",
        heading: "#666",
        icon: "#777",
        separator: "#E8E8E8",
        placeholder: "#a9a9a9",
        hover: "#dbdbdb",
        backdrop: "#0000001a"
      },
      disabled: {
        accent: "#008836",
        accentForeground: "#ffffff",
        paragraph: "#A6A6A6",
        background: "#ffffff",
        border: "#E8E8E8",
        heading: "#212121",
        icon: "#DADADA",
        separator: "#E8E8E8",
        placeholder: "#a9a9a9",
        hover: "#00000010",
        backdrop: "#0000001a"
      },
      selected: {
        accent: "#008836",
        accentForeground: "#ffffff",
        paragraph: "#212121",
        background: "#00883610",
        border: "#008836",
        heading: "#212121",
        icon: "#FFFFFF",
        separator: "#E8E8E8",
        placeholder: "#a9a9a9",
        hover: "#eee",
        backdrop: "#0000001a"
      },
      error: {
        accent: "#f54b42",
        accentForeground: "#ffffff",
        paragraph: "#FF242E",
        background: "#FFEDEE",
        border: "#F7999D",
        heading: "#f54b42",
        icon: "#FB2C36",
        separator: "#E8E8E8",
        placeholder: "#a9a9a9",
        hover: "#00000010",
        backdrop: "#0000001a"
      },
      success: {
        accent: "#4F8A10",
        accentForeground: "#ffffff",
        paragraph: "#4F8A10",
        background: "#85ce68",
        border: "#E8E8E8",
        heading: "#4F8A10",
        icon: "#4F8A10",
        separator: "#E8E8E8",
        placeholder: "#a9a9a9",
        hover: "#00000010",
        backdrop: "#0000001a"
      }
    },
    statusBar: {
      primary: { paragraph: "#5E5E5E", background: "#f7f7f7" }
    },
    navigationMenu: {
      primary: {
        background: "#f7f7f7",
        paragraph: "#666",
        icon: "#666",
        hover: "#eee"
      },
      secondary: { background: "#EEEEEE" },
      selected: {
        background: "#ddd",
        hover: "#eee"
      }
    },
    contextMenu: { primary: { background: "#f7f7f7" } },
    editor: { selected: { background: "#e1e1e1" } },
    sheet: { selected: { paragraph: "#008836" } }
  }
};

export const THEME_DARK: ThemeDefinition = {
  name: "Notesnook Dark",
  id: "default-dark",
  version: 2.1,
  license: "GPL-3.0-or-later",
  homepage: "https://notesnook.com",
  description: "The default dark theme for the Notesnook app",
  colorScheme: "dark",
  codeBlockCSS: ``,
  compatibilityVersion: 1,
  authors: [
    {
      name: "Streetwriters",
      email: "support@streetwriters.co",
      url: "https://streetwriters.co"
    }
  ],
  scopes: {
    base: {
      primary: {
        accent: "#008836",
        accentForeground: "#ffffff",
        paragraph: "#F2F2F2",
        background: "#181818",
        border: "#2A2A2A",
        heading: "#FFFFFF",
        icon: "#FFFFFF",
        separator: "#383838",
        placeholder: "#404040",
        hover: "#2b2b2b",
        backdrop: "#35353580",
        buttonForeground: "#FFFFFF"
      },
      secondary: {
        accent: "#0D9E46",
        accentForeground: "#ffffff",
        paragraph: "#A1A1A1",
        background: "#252525",
        border: "#0A5729",
        heading: "#C0BFBF",
        icon: "#808080",
        separator: "#383838",
        placeholder: "#404040",
        hover: "#ffffff10",
        backdrop: "#35353580",
        buttonForeground: "#BFBFBF"
      },
      tertiary: {
        accent: "#0D9E46",
        accentForeground: "#ffffff",
        paragraph: "#818589",
        background: "#2C2C2C",
        border: "#2b2b2b",
        heading: "#808080",
        icon: "#808080",
        separator: "#383838",
        placeholder: "#404040",
        hover: "#ffffff10",
        backdrop: "#35353580"
      },
      disabled: {
        accent: "#008836",
        accentForeground: "#ffffff",
        paragraph: "#505050",
        background: "#ffffff",
        border: "#383838",
        heading: "#212121",
        icon: "#FFFFFF",
        separator: "#383838",
        placeholder: "#404040",
        hover: "#ffffff10",
        backdrop: "#35353580"
      },
      selected: {
        accent: "#008836",
        accentForeground: "#ffffff",
        paragraph: "#FBFBFB",
        background: "#494949",
        border: "#008836",
        heading: "#e3e3e3",
        icon: "#008836",
        separator: "#383838",
        placeholder: "#404040",
        hover: "#ffffff10",
        backdrop: "#35353580"
      },
      error: {
        accent: "#f54b42",
        accentForeground: "#ffffff",
        paragraph: "#f54b42",
        background: "#250b0a",
        border: "#F7999D",
        heading: "#f54b42",
        icon: "#f54b42",
        separator: "#383838",
        placeholder: "#404040",
        hover: "#ffffff10",
        backdrop: "#35353580"
      },
      success: {
        accent: "#4F8A10",
        accentForeground: "#ffffff",
        paragraph: "#4F8A10",
        background: "#132204",
        border: "#383838",
        heading: "#4F8A10",
        icon: "#4F8A10",
        separator: "#383838",
        placeholder: "#404040",
        hover: "#ffffff10",
        backdrop: "#35353580"
      }
    },
    list: { selected: { background: "#202020" } },
    contextMenu: { primary: { background: "#202020" } },
    sheet: { selected: { paragraph: "#008836" } }
  },
  $schema:
    "https://raw.githubusercontent.com/streetwriters/notesnook-themes/main/schemas/v1.schema.json"
};
