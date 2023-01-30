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
import { ThemeDark } from "./dark";

export const ThemeDracula: ThemeDefinition = {
  ...ThemeDark,
  colorScheme: "dark",
  id: "dracula-theme",
  name: "Dracula theme",
  scopes: {
    base: {
      primary: {
        accent: "#bd93f9",
        background: "#282a36",
        border: "#383838",
        placeholder: "#404040",
        heading: "#f8f8f2",
        paragraph: "#f8f8f2",
        icon: "#808080",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#bd93f912",
        shade: "#bd93f912"
      },
      secondary: {
        accent: "#bd93f9",
        background: "#bd93f920",
        border: "#383838",
        placeholder: "#404040",
        heading: "#808080",
        paragraph: "#818589",
        icon: "#808080",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#bd93f912",
        shade: "#bd93f912"
      },
      disabled: {
        accent: "#bd93f9",
        background: "#000000",
        border: "#383838",
        placeholder: "#404040",
        heading: "#212121",
        paragraph: "#505050",
        icon: "#808080",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#00883712"
      },
      error: {
        accent: "#ff5555",
        background: "#f4433620",
        border: "#383838",
        placeholder: "#404040",
        heading: "#ff5555",
        paragraph: "#ff5555",
        icon: "#ff5555",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#ff555512"
      },
      warning: {
        accent: "#ffb86c",
        background: "#ffb86c20",
        border: "#383838",
        placeholder: "#404040",
        heading: "#ffb86c",
        paragraph: "#ffb86c",
        icon: "#ffb86c",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#ffb86c12"
      },
      success: {
        accent: "#50fa7b",
        background: "#50fa7b20",
        border: "#383838",
        placeholder: "#404040",
        heading: "#50fa7b",
        paragraph: "#50fa7b",
        icon: "#50fa7b",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#ffffff10",
        shade: "#50fa7b12"
      }
    },
    navigationMenu: {
      primary: {
        accent: "#bd93f9",
        background: "#383a59",
        border: "#383838",
        placeholder: "#404040",
        heading: "#bd93f9",
        paragraph: "#f8f8f2",
        icon: "#282a36AA",
        separator: "#383838",
        backdrop: "#35353580",
        hover: "#282a3612",
        shade: "#bd93f912"
      },
      secondary: {
        background: "#bd93f920"
      }
    },
    popup: {
        primary: {
            background: "#282a36"
        },
        secondary: {
            background: "#bd93f9"
        }
    }
  }
};
