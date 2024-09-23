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

import { TemplateData } from "./index.js";
import { formatDate } from "../date.js";

export const buildMarkdown = (data: TemplateData) => `# ${data.title}

${data.content}`;

export const templateWithFrontmatter = (data: TemplateData) => `---
${buildFrontmatter(data)}
---

# ${data.title}

${data.content}`;

function buildFrontmatter(data: TemplateData) {
  const lines = [
    `title: ${JSON.stringify(data.title || "")}`,
    `created_at: ${formatDate(data.dateCreated)}`,
    `updated_at: ${formatDate(data.dateEdited)}`
  ];
  if (data.pinned) lines.push(`pinned: ${data.pinned}`);
  if (data.favorite) lines.push(`favorite: ${data.favorite}`);
  if (data.color) lines.push(`color: ${data.color}`);
  if (data.tags) lines.push(`tags: ${data.tags.join(", ")}`);
  return lines.join("\n");
}
