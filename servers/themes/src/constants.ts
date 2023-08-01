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

import path from "path";
import { Counter } from "./counter";

export const THEMES_REPO_URL = `https://github.com/streetwriters/notesnook-themes.git`;
export const THEME_REPO_DIR_NAME = "notesnook-themes";
export const THEME_METADATA_JSON = path.join(__dirname, "themes-metadata.json");
export const THEME_REPO_DIR_PATH = path.resolve(
  path.join(__dirname, "..", THEME_REPO_DIR_NAME)
);
export const InstallsCounter = new Counter("installs", path.dirname(__dirname));
