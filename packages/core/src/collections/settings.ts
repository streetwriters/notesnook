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

import { EV, EVENTS } from "../common";
import { getId } from "../utils/id";
import Database from "../api";
import {
  DefaultNotebook,
  GroupOptions,
  GroupingKey,
  SettingsItem,
  ToolbarConfig,
  TrashCleanupInterval
} from "../types";
import { ICollection } from "./collection";
import { TimeFormat } from "../utils/date";

class Settings implements ICollection {
  name = "settings";
  private settings: SettingsItem = {
    type: "settings",
    dateModified: 0,
    dateCreated: 0,
    id: getId()
  };
  constructor(private readonly db: Database) {}

  async init() {
    const settings = await this.db.storage().read<SettingsItem>("settings");
    this.reset(settings);
    await this.save(false);

    EV.subscribe(EVENTS.userLoggedOut, async () => {
      this.reset();
      await this.save(false);
    });
  }

  get raw() {
    return this.settings;
  }

  async merge(remoteItem: SettingsItem, lastSynced: number) {
    if (this.settings.dateModified > lastSynced) {
      this.settings.id = remoteItem.id;
      this.settings.groupOptions = {
        ...this.settings.groupOptions,
        ...remoteItem.groupOptions
      };
      this.settings.toolbarConfig = {
        ...this.settings.toolbarConfig,
        ...remoteItem.toolbarConfig
      };
      this.settings.aliases = {
        ...this.settings.aliases,
        ...remoteItem.aliases
      };
      this.settings.dateModified = Date.now();
    } else {
      this.reset(remoteItem);
    }
    await this.save(false);
  }

  async setGroupOptions(key: GroupingKey, groupOptions: GroupOptions) {
    if (!this.settings.groupOptions) this.settings.groupOptions = {};
    this.settings.groupOptions[key] = groupOptions;
    await this.save();
  }

  getGroupOptions(key: GroupingKey) {
    return (
      (this.settings.groupOptions && this.settings.groupOptions[key]) || {
        groupBy: "default",
        sortBy:
          key === "trash"
            ? "dateDeleted"
            : key === "tags"
            ? "dateCreated"
            : "dateEdited",
        sortDirection: "desc"
      }
    );
  }

  async setToolbarConfig(key: string, config: ToolbarConfig) {
    if (!this.settings.toolbarConfig) this.settings.toolbarConfig = {};
    this.settings.toolbarConfig[key] = config;
    await this.save();
  }

  getToolbarConfig(key: string) {
    return this.settings.toolbarConfig && this.settings.toolbarConfig[key];
  }

  /**
   * Setting to -1 means never clear trash.
   */
  async setTrashCleanupInterval(interval: TrashCleanupInterval) {
    this.settings.trashCleanupInterval = interval;
    await this.save();
  }

  getTrashCleanupInterval() {
    return this.settings.trashCleanupInterval || 7;
  }

  async setDefaultNotebook(item: DefaultNotebook | undefined) {
    this.settings.defaultNotebook = !item
      ? undefined
      : {
          id: item.id,
          topic: item.topic
        };
    await this.save();
  }

  getDefaultNotebook() {
    return this.settings.defaultNotebook;
  }

  async setTitleFormat(format: string) {
    this.settings.titleFormat = format;
    await this.save();
  }

  getTitleFormat() {
    return this.settings.titleFormat || "Note $date$ $time$";
  }

  getDateFormat() {
    return this.settings.dateFormat || "DD-MM-YYYY";
  }

  async setDateFormat(format: string) {
    this.settings.dateFormat = format;
    await this.save();
  }

  getTimeFormat() {
    return this.settings.timeFormat || "12-hour";
  }

  async setTimeFormat(format: TimeFormat) {
    this.settings.timeFormat = format || "12-hour";
    await this.save();
  }

  /**
   * @deprecated only kept here for migration purposes.
   */
  getAlias(id: string) {
    return this.settings.aliases && this.settings.aliases[id];
  }

  private reset(settings?: Partial<SettingsItem>) {
    this.settings = {
      type: "settings",
      id: getId(),
      dateModified: 0,
      dateCreated: 0,
      ...(settings || {})
    };
  }

  private async save(updateDateModified = true) {
    this.db.eventManager.publish(
      EVENTS.databaseUpdated,
      "settings",
      this.settings
    );

    if (updateDateModified) {
      this.settings.dateModified = Date.now();
      this.settings.synced = false;
    }
    delete this.settings.remote;

    await this.db.storage().write("settings", this.settings);
  }
}
export default Settings;
