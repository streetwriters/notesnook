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
import id from "../utils/id";
import "../types";

class Settings {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
  }

  async init() {
    var settings = await this._db.storage.read("settings");
    this._initSettings(settings);
    await this._saveSettings(false);

    EV.subscribe(EVENTS.userLoggedOut, async () => {
      this._initSettings();
      await this._saveSettings(false);
    });
  }

  get raw() {
    return this._settings;
  }

  async merge(item) {
    if (this._settings.dateModified > (await this._db.lastSynced())) {
      this._settings.id = item.id;
      this._settings.groupOptions = {
        ...this._settings.groupOptions,
        ...item.groupOptions
      };
      this._settings.toolbarConfig = {
        ...this._settings.toolbarConfig,
        ...item.toolbarConfig
      };
      this._settings.aliases = {
        ...this._settings.aliases,
        ...item.aliases
      };
      this._settings.dateModified = Date.now();
    } else {
      this._initSettings(item);
    }
    await this._saveSettings(false);
  }

  /**
   *
   * @param {GroupingKey} key
   * @param {GroupOptions} groupOptions
   */
  async setGroupOptions(key, groupOptions) {
    this._settings.groupOptions[key] = groupOptions;
    await this._saveSettings();
  }

  /**
   *
   * @param {GroupingKey} key
   * @returns {GroupOptions}
   */
  getGroupOptions(key) {
    return (
      this._settings.groupOptions[key] || {
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

  /**
   *
   * @param {string} key
   * @param {{preset: string, config?: any[]}} config
   */
  async setToolbarConfig(key, config) {
    this._settings.toolbarConfig[key] = config;
    await this._saveSettings();
  }

  /**
   *
   * @param {string} key
   * @returns {{preset: string, config: any[]}}
   */
  getToolbarConfig(key) {
    return this._settings.toolbarConfig[key];
  }

  async setAlias(id, name) {
    this._settings.aliases[id] = name;
    await this._saveSettings();
  }

  getAlias(id) {
    return this._settings.aliases[id];
  }
  /**
   * Setting to -1 means never clear trash.
   * @param {7 | 30 | 365 | -1} time
   */
  async setTrashCleanupInterval(time) {
    this._settings.trashCleanupInterval = time;
    await this._saveSettings();
  }

  /**
   * @returns {7 | 30 | 365 | -1}
   */
  getTrashCleanupInterval() {
    return this._settings.trashCleanupInterval || 7;
  }

  _initSettings(settings) {
    this._settings = {
      type: "settings",
      id: id(),
      groupOptions: {},
      toolbarConfig: {},
      aliases: {},
      dateModified: 0,
      dateCreated: 0,
      trashCleanupInterval: 7,
      ...(settings || {})
    };
  }

  async _saveSettings(updateDateModified = true) {
    if (updateDateModified) {
      this._settings.dateModified = Date.now();
      this._settings.synced = false;
    }

    await this._db.storage.write("settings", this._settings);
    this._db.eventManager.publish(EVENTS.databaseUpdated, this._settings);
  }
}
export default Settings;
