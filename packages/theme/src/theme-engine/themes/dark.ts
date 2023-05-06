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
import { ThemeDefinition } from "../types";
import { ThemeLight } from "./light";

export const ThemeDark: ThemeDefinition = {
  ...ThemeLight,
  colorScheme: "dark",
  id: "notesnook-default-theme-dark",
  scopes: {
    base: {
      primary: {
        accent: "#008837",
        background: "#0d0d0d",
        border: "#202020",
        placeholder: "#404040",
        heading: "#e3e3e3",
        paragraph: "#D3D3D3",
        icon: "#808080",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#00883712",
        textSelection: "#00883777"
      },
      secondary: {
        accent: "#008837",
        background: "#151515",
        border: "#202020",
        placeholder: "#404040",
        heading: "#808080",
        paragraph: "#818589",
        icon: "#808080",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#00883712",
        textSelection: "#00883777"
      },
      disabled: {
        accent: "#008837",
        background: "#ffffff",
        border: "#383838",
        placeholder: "#404040",
        heading: "#212121",
        paragraph: "#505050",
        icon: "#808080",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#00883712",
        textSelection: "#00883777"
      },
      error: {
        accent: "#f54b42",
        background: "#f4433620",
        border: "#383838",
        placeholder: "#404040",
        heading: "#f54b42",
        paragraph: "#f54b42",
        icon: "#f54b42",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#00883712",
        textSelection: "#f54b4255"
      },
      warning: {
        accent: "#FFA500",
        background: "#FFA50020",
        border: "#383838",
        placeholder: "#404040",
        heading: "#FFA500",
        paragraph: "#FFA500",
        icon: "#FFA500",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#FFA50012",
        textSelection: "#FFA50055"
      },
      success: {
        accent: "#4F8A10",
        background: "#00FF0020",
        border: "#383838",
        placeholder: "#404040",
        heading: "#4F8A10",
        paragraph: "#4F8A10",
        icon: "#4F8A10",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#4F8A1012",
        textSelection: "#4F8A1055"
      }
    }
  }
};
