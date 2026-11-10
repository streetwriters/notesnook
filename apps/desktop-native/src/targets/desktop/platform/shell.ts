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

import { Linking } from "react-native";
import fs from "@react-native-gpui/fs";
import type { Shell } from "../../../platform";
import { htmlToPdf, printPdf } from "./pdf";

export const shell: Shell = {
  openUrl(url) {
    Linking.openURL(url).catch(() => {});
  },
  async openPath(path) {
    await fs.promises.openExternal(path);
  },
  async showItemInFolder(path) {
    await fs.promises.reveal(path);
  },
  async printHtml(title, html, options) {
    return printPdf(title, await htmlToPdf(title, html), options?.outputPath);
  },
  htmlToPdf
};
