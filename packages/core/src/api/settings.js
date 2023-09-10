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

  async merge(remoteItem, lastSynced) {
    if (this._settings.dateModified > lastSynced) {
      this._settings = {
        ...this._settings,
        ...(remoteItem.deleted
          ? {}
          : {
              ...remoteItem,
              groupOptions: {
                ...this._settings.groupOptions,
                ...remoteItem.groupOptions
              },
              toolbarConfig: {
                ...this._settings.toolbarConfig,
                ...remoteItem.toolbarConfig
              },
              aliases: {
                ...this._settings.aliases,
                ...remoteItem.aliases
              }
            })
      };
      this._settings.dateModified = Date.now();
    } else {
      this._initSettings(remoteItem);
    }
    await this._saveSettings(false);
  }

  /**
   *
   * @param {GroupingKey} key
   * @param {GroupOptions} groupOptions
   */
  async setGroupOptions(key, groupOptions) {
    if (!this._settings.groupOptions) this._settings.groupOptions = {};
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
      (this._settings.groupOptions && this._settings.groupOptions[key]) || {
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
    if (!this._settings.toolbarConfig) this._settings.toolbarConfig = {};
    this._settings.toolbarConfig[key] = config;
    await this._saveSettings();
  }

  /**
   *
   * @param {string} key
   * @returns {{preset: string, config: any[]}}
   */
  getToolbarConfig(key) {
    return this._settings.toolbarConfig && this._settings.toolbarConfig[key];
  }

  async setAlias(id, name) {
    if (!this._settings.aliases) this._settings.aliases = {};
    this._settings.aliases[id] = name;
    await this._saveSettings();
  }

  getAlias(id) {
    return this._settings.aliases && this._settings.aliases[id];
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

  /**
   *
   * @param {{id: string, topic?: string} | undefined} item
   */
  async setDefaultNotebook(item) {
    this._settings.defaultNotebook = !item
      ? undefined
      : {
          id: item.id,
          topic: item.topic
        };
    await this._saveSettings();
  }
  /**
   *
   * @returns {{id: string, topic?: string} | undefined}
   */
  getDefaultNotebook() {
    return this._settings.defaultNotebook;
  }

  async setTitleFormat(format) {
    this._settings.titleFormat = format;
    await this._saveSettings();
  }

  getTitleFormat() {
    return this._settings.titleFormat || "Note $date$ $time$";
  }

  getDateFormat() {
    return this._settings.dateFormat || "DD-MM-YYYY";
  }

  async setDateFormat(format) {
    this._settings.dateFormat = format;
    await this._saveSettings();
  }
  /**
   *
   * @returns {"12-hour" | "24-hour"}
   */
  getTimeFormat() {
    return this._settings.timeFormat || "12-hour";
  }

  async setTimeFormat(format) {
    this._settings.timeFormat = format;
    await this._saveSettings();
  }

  _initSettings(settings) {
    this._settings = {
      type: "settings",
      id: getId(),
      dateModified: 0,
      dateCreated: 0,
      ...(settings || {})
    };
  }

  async _saveSettings(updateDateModified = true) {
    this._db.eventManager.publish(
      EVENTS.databaseUpdated,
      "settings",
      this._settings
    );

    if (updateDateModified) {
      this._settings.dateModified = Date.now();
      this._settings.synced = false;
    }
    delete this._settings.remote;

    await this._db.storage.write("settings", this._settings);
  }
}
export default Settings;
