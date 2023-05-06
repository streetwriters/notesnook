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

export const ThemeLight: ThemeDefinition = {
  name: "Default theme",
  author: "Notesnook",
  colorScheme: "light",
  compatibilityVersion: "1.0",
  description: "The default theme for Notesnook app",
  homepage: "https://notesnook.com",
  id: "notesnook-default-theme-light",
  tags: ["theme"],
  version: "1.0",
  codeBlockCSS: `code[class*=language-],pre[class*=language-]{color:#f8f8f2;background:0 0;text-shadow:0 1px rgba(0,0,0,.3);font-family:Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace;text-align:left;white-space:pre;word-spacing:normal;word-break:normal;word-wrap:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-hyphens:none;-moz-hyphens:none;-ms-hyphens:none;hyphens:none}pre[class*=language-]{padding:1em;margin:.5em 0;overflow:auto;border-radius:.3em}:not(pre)>code[class*=language-],pre[class*=language-]{background:#282a36}:not(pre)>code[class*=language-]{padding:.1em;border-radius:.3em;white-space:normal}.token.cdata,.token.comment,.token.doctype,.token.prolog{color:#6272a4}.token.punctuation{color:#f8f8f2}.namespace{opacity:.7}.token.constant,.token.deleted,.token.property,.token.symbol,.token.tag{color:#ff79c6}.token.boolean,.token.number{color:#bd93f9}.token.attr-name,.token.builtin,.token.char,.token.inserted,.token.selector,.token.string{color:#50fa7b}.language-css .token.string,.style .token.string,.token.entity,.token.operator,.token.url,.token.variable{color:#f8f8f2}.token.atrule,.token.attr-value,.token.class-name,.token.function{color:#f1fa8c}.token.keyword{color:#8be9fd}.token.important,.token.regex{color:#ffb86c}.token.bold,.token.important{font-weight:700}.token.italic{font-style:italic}.token.entity{cursor:help}`,
  scopes: {
    base: {
      primary: {
        accent: "#008837",
        background: "#ffffff",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#212121",
        paragraph: "#303030",
        icon: "#303030",
        separator: "#E8E8E8",
        backdrop: "#0000001a",
        hover: "#00000010",
        shade: "#00883712",
        textSelection: "#00883777"
      },
      secondary: {
        accent: "#008837",
        background: "#f7f7f7",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#808080",
        paragraph: "#666",
        icon: "#666",
        separator: "#E8E8E8",
        backdrop: "#0000001a",
        hover: "#dbdbdb",
        shade: "#00883712",
        textSelection: "#00883777"
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
        backdrop: "#0000001a",
        hover: "#00000010",
        shade: "#00883712",
        textSelection: "#00883777"
      },
      error: {
        accent: "#f54b42",
        background: "#f4433620",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#f54b42",
        paragraph: "#f54b42",
        icon: "#f54b42",
        separator: "#E8E8E8",
        backdrop: "#0000001a",
        hover: "#00000010",
        shade: "#00883712",
        textSelection: "#00883777"
      },
      warning: {
        accent: "#FFA500",
        background: "#ffffff",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#FFA500",
        paragraph: "#FFA500",
        icon: "#FFA500",
        separator: "#E8E8E8",
        backdrop: "#0000001a",
        hover: "#00000010",
        shade: "#FFA50012",
        textSelection: "#00883777"
      },
      success: {
        accent: "#4F8A10",
        background: "#00FF0020",
        border: "#E8E8E8",
        placeholder: "#a9a9a9",
        heading: "#4F8A10",
        paragraph: "#4F8A10",
        icon: "#4F8A10",
        separator: "#E8E8E8",
        backdrop: "#0000001a",
        hover: "#00000010",
        shade: "#4F8A1012",
        textSelection: "#00883777"
      }
    },
    statusBar: {
      primary: {
        background: "#f7f7f7",
        paragraph: "#5E5E5E"
      }
    },
    navigationMenu: {
      primary: {
        background: "#f7f7f7",
        paragraph: "#303030",
        icon: "#303030"
      },
      secondary: {
        background: "#EEEEEE"
      }
    }
  }
};
