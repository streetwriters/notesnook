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

import { getId } from "../utils/id.js";
import Database from "../api/index.js";
import { LegacySettingsItem } from "../types.js";
import { ICollection } from "./collection.js";

/**
 * @deprecated only kept here for migration purposes
 */
export class LegacySettings implements ICollection {
  name = "legacy-settings";
  private settings: LegacySettingsItem = {
    type: "settings",
    dateModified: 0,
    dateCreated: 0,
    id: getId()
  };
  constructor(private readonly db: Database) {}

  async init() {
    const settings = await this.db
      .storage()
      .read<LegacySettingsItem>("settings");
    if (settings) this.settings = settings;
  }

  get raw() {
    return this.settings;
  }

  /**
   * @deprecated only kept here for migration purposes
   */
  getAlias(id: string) {
    return this.settings.aliases && this.settings.aliases[id];
  }
}
