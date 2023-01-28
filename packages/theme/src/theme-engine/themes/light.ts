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
import { Theme } from "../types";

export const ThemeLight: Theme = {
  name: "Default theme",
  author: "Notesnook",
  colorScheme: "light",
  compatibilityVersion: "1.0",
  description: "The default theme for Notesnook app",
  homepage: "https://notesnook.com",
  id: "notesnook-default-theme",
  tags: ["theme"],
  version: "1.0",
  scopes: {
    base: {
      primary: {
        accent: "#008837",
        background: "#ffffff",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#212121",
        paragraph: "#505050",
        icon: "#808080",
        separator: "#E8E8E8",
        hover: "#00000010",
        shade: "#00883712"
      },
      secondary: {
        accent: "#008837",
        background: "#f7f7f7",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#808080",
        paragraph: "#818589",
        icon: "#808080",
        separator: "#E8E8E8",
        hover: "#00000010",
        shade: "#00883712"
      },
      disabled: {
        accent: "#008837",
        background: "#ffffff",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#212121",
        paragraph: "#505050",
        icon: "#808080",
        separator: "#E8E8E8",
        hover: "#00000010",
        shade: "#00883712"
      },
      error: {
        accent: "#008837",
        background: "#f4433620",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#ff6961",
        paragraph: "#ff6961",
        icon: "#ff6961",
        separator: "#E8E8E8",
        hover: "#00000010",
        shade: "#00883712"
      },
      warning: {
        accent: "#008837",
        background: "#ffffff",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#212121",
        paragraph: "#505050",
        icon: "#808080",
        separator: "#E8E8E8",
        hover: "#00000010",
        shade: "#00883712"
      },
      success: {
        accent: "#008837",
        background: "#00FF0020",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#4F8A10",
        paragraph: "#4F8A10",
        icon: "#4F8A10",
        separator: "#E8E8E8",
        hover: "#00000010",
        shade: "#00883712"
      }
    }
  }
};
