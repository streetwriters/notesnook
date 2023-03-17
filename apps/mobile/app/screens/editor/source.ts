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

import { Platform } from "react-native";

const EditorMobileSourceUrl =
  Platform.OS === "android"
    ? "file:///android_asset/index.html"
    : "build.bundle/index.html";
/**
 * Replace this with dev url when debugging or working on the editor mobile repo.
 * The url should be something like this: http://192.168.100.126:3000/index.html
 */
export const EDITOR_URI = __DEV__
  ? "http://192.168.8.103:3000/index.html"
  : EditorMobileSourceUrl;
