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

import { ICollection } from "./collection";
import { getId } from "../utils/id";
import { Color } from "../types";
import Database from "../api";
import { Tags } from "./tags";
import { SQLCollection } from "../database/sql-collection";
import { isFalse } from "../database";

export const DefaultColors: Record<string, string> = {
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#FFD600",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E"
};

export class Colors implements ICollection {
  name = "colors";
  readonly collection: SQLCollection<"colors", Color>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "colors",
      db.eventManager
    );
  }

  init() {
    return this.collection.init();
  }

  color(id: string) {
    return this.collection.get(id);
  }

  find(colorCode: string) {
    return this.all.find((eb) => eb.and([eb("colorCode", "==", colorCode)]));
  }

  // async merge(remoteColor: MaybeDeletedItem<Color>) {
  //   if (!remoteColor) return;

  //   const localColor = this.collection.get(remoteColor.id);
  //   if (!localColor || remoteColor.dateModified > localColor.dateModified)
  //     await this.collection.add(remoteColor);
  // }

  async add(item: Partial<Color>) {
    if (item.remote)
      throw new Error("Please use db.colors.merge to merge remote colors.");

    item.title = item.title ? Tags.sanitize(item.title) : item.title;
    const oldColor = item.id
      ? await this.color(item.id)
      : item.colorCode
      ? await this.find(item.colorCode)
      : undefined;

    if (!item.title && !oldColor?.title) throw new Error("Title is required.");
    if (!item.colorCode && !oldColor?.colorCode)
      throw new Error("Color code is required.");

    const id =
      oldColor && item.colorCode === oldColor.colorCode
        ? oldColor.id
        : item.id || getId(item.dateCreated);

    await this.collection.upsert({
      id,
      dateCreated: item.dateCreated || oldColor?.dateCreated || Date.now(),
      dateModified: item.dateModified || oldColor?.dateModified || Date.now(),
      title: item.title || oldColor?.title || "",
      colorCode: item.colorCode || oldColor?.colorCode || "",
      type: "color",
      remote: false
    });
    return id;
  }

  // get raw() {
  //   return this.collection.raw();
  // }

  get all() {
    return this.collection.createFilter<Color>(
      (qb) => qb.where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  async remove(...ids: string[]) {
    await this.db.transaction(async () => {
      await this.db.relations.unlinkOfType("color", ids);
      await this.collection.softDelete(ids);
    });
  }

  // async delete(id: string) {
  //   await this.collection.delete(id);
  //   await this.db.relations.cleanup();
  // }

  exists(id: string) {
    return this.collection.exists(id);
  }

  // find(idOrTitle: string) {
  //   return this.all.find((t) => t.title === idOrTitle || t.id === idOrTitle);
  // }
}
