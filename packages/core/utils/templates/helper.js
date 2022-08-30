/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { formatDate } from "../date";

function generateMetaTags(metadata, createMetaTag) {
  let metaTags = [];
  for (let key in metadata) {
    let value = metadata[key];
    if (typeof value === "object" && !Array.isArray(value)) continue;
    else if (Array.isArray(value)) value = value.join(", ");

    // we must have no new line characters
    if (typeof value === "string") value = value.replace(/\r?\n|\r/g, "");

    metaTags.push(createMetaTag(key, value));
  }
  return metaTags;
}

export function buildPage(
  template,
  createMetaTag,
  { metadata, title, headline, content, createdOn, editedOn }
) {
  let page = template;

  if (createMetaTag)
    page = page.replace(
      /{{metaTags}}/g,
      generateMetaTags(metadata, createMetaTag).join("\n")
    );

  page = page.replace(/{{title}}/g, title);
  page = page.replace(/{{headline}}/g, headline);
  page = page.replace(/{{content}}/g, content);
  page = page.replace(/{{createdOn}}/g, formatDate(createdOn));
  page = page.replace(/{{editedOn}}/g, formatDate(editedOn));
  return page;
}
