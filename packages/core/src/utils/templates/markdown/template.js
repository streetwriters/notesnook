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

export const template = (data) => `# ${data.title}

${data.content}`;

export const templateWithFrontmatter = (data) => `---
${buildFrontmatter(data)}
---

# ${data.title}

${data.content}`;

function buildFrontmatter(data) {
  const lines = [
    `title: ${JSON.stringify(data.title || "")}`,
    `created_at: ${data.createdOn}`,
    `updated_at: ${data.editedOn}`
  ];
  if (data.metadata.pinned) lines.push(`pinned: ${data.metadata.pinned}`);
  if (data.metadata.favorite) lines.push(`favorite: ${data.metadata.favorite}`);
  if (data.metadata.color) lines.push(`color: ${data.metadata.color}`);
  if (data.tags) lines.push(`tags: ${data.tags}`);
  return lines.join("\n");
}
