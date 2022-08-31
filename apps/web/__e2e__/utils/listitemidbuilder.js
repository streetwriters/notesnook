/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

const { getTestId } = require(".");

class ListItemIDBuilder {
  static new(type) {
    return new ListItemIDBuilder(type);
  }

  constructor(type) {
    this.type = type;
  }

  view(viewId) {
    this.viewId = viewId;
    return this;
  }

  atIndex(index) {
    this.index = index;
    return this;
  }

  title() {
    this.suffix = "title";
    return this;
  }

  color(color) {
    this.suffix = "colors-" + color;
    return this;
  }

  tag(tag) {
    this.suffix = `tags-${tag}`;
    return this;
  }

  locked() {
    this.suffix = "locked";
    return this;
  }

  body() {
    this.suffix = "body";
    return this;
  }

  topic(index) {
    this.suffix = `topic-${index}`;
    return this;
  }

  grouped() {
    this.isGrouped = true;
    return this;
  }

  build() {
    if (this.isGrouped) this.index++;

    const id = getTestId(
      `${this.type}-${this.index}${this.suffix ? `-${this.suffix}` : ""}`
    );

    if (this.isGrouped) {
      this.index--;
    }
    if (this.viewId) return `#${this.viewId} ${id}`;
    return id;
  }
}
module.exports = ListItemIDBuilder;
