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

import type { ToolId } from "./tools.js";

/** A group is a list of tool ids; a nested list is a "more" dropdown. */
export type ToolbarGroupDefinition = (ToolId | ToolId[])[];
export type ToolbarDefinition = ToolbarGroupDefinition[];

export const STATIC_TOOLBAR_GROUPS: ToolbarDefinition = [
  [
    "insertBlock",
    "tableSettings",
    "cellProperties",
    "imageSettings",
    "embedSettings",
    "attachmentSettings",
    "linkSettings",
    "codeRemove",
    "outdent",
    "indent",
    "webclipSettings"
  ]
];

export const MOBILE_STATIC_TOOLBAR_GROUPS: ToolbarDefinition = [
  [...STATIC_TOOLBAR_GROUPS[0], "previewAttachment"]
];

export const READONLY_MOBILE_STATIC_TOOLBAR_GROUPS: ToolbarDefinition = [
  [
    "imageSettings",
    "attachmentSettings",
    "linkSettings",
    "webclipSettings",
    "previewAttachment"
  ]
];

export const READONLY_MOBILE_TOOLBAR_NODES = [
  "image",
  "attachment",
  "webclip",
  "link"
];

export const TOOLBAR_PRESETS: Record<"default" | "minimal", ToolbarDefinition> =
  {
    default: [
      [
        "bold",
        "italic",
        "underline",
        [
          "strikethrough",
          "code",
          "subscript",
          "superscript",
          "highlight",
          "textColor",
          "math"
        ]
      ],
      ["fontSize"],
      ["headings", "fontFamily"],
      ["checkList", "numberedList", "bulletList"],
      ["addLink", "addInternalLink"],
      ["alignment", "textDirection"],
      ["clearformatting"]
    ],
    minimal: [
      ["bold", "italic", "underline", "strikethrough", "code"],
      ["headings", "addLink"],
      ["clearformatting"]
    ]
  };
