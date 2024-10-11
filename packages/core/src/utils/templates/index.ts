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

import { Note } from "../../types.js";
import { buildHTML } from "./html/index.js";
import { buildMarkdown, templateWithFrontmatter } from "./md.js";
import { buildText } from "./text.js";

export type TemplateData = Omit<Note, "tags" | "color"> & {
  tags?: string[];
  color?: string;
  content: string;
};

export async function buildFromTemplate(
  format: "md" | "txt" | "html" | "md-frontmatter",
  data: TemplateData
): Promise<string> {
  switch (format) {
    case "html":
      return buildHTML(data);
    case "md":
      return buildMarkdown(data);
    case "md-frontmatter":
      return templateWithFrontmatter(data);
    case "txt":
      return buildText(data);
    default:
      throw new Error("Unsupported format.");
  }
}
