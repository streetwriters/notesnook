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

import hosts from "../utils/constants";

export default class Debug {
  strip(item) {
    if (!item) return "{}";
    return JSON.stringify({
      title: !!item.title,
      description: !!item.description,
      headline: !!item.headline,
      colored: !!item.color,
      type: item.type,
      notebooks: item.notebooks,
      notes: item.notes,
      noteIds: item.noteIds,
      tags: item.tags,
      id: item.id,
      contentId: item.contentId,
      dateModified: item.dateModified,
      dateEdited: item.dateEdited,
      dateDeleted: item.dateDeleted,
      dateCreated: item.dateCreated,
      additionalData: item.additionalData
    });
  }

  /**
   *
   * @param {{
   * title: string,
   * body: string,
   * userId: string | undefined
   * }} reportData
   * @returns {Promise<string>} link to the github issue
   */
  async report(reportData) {
    if (!reportData) return;

    const { title, body, userId } = reportData;
    const response = await fetch(`${hosts.ISSUES_HOST}/create/notesnook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId })
    });
    if (!response.ok) return;
    const json = await response.json();
    return json.url;
  }
}
