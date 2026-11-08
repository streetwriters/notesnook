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

import { Image } from "react-native";
import fs from "@react-native-gpui/fs";
import {
  manipulateAsync,
  SaveFormat
} from "@react-native-gpui/image-manipulator";
import type { ImageCompressor } from "../../../platform";

function naturalWidth(uri: string) {
  return new Promise<number>((resolve, reject) =>
    Image.getSize(uri, (width) => resolve(width), reject)
  );
}

export const imageCompressor: ImageCompressor = {
  async compress(file, { maxWidth, quality }) {
    const width =
      typeof maxWidth === "function"
        ? maxWidth(await naturalWidth(file.uri))
        : maxWidth;
    const result = await manipulateAsync(file.uri, [{ resize: { width } }], {
      compress: quality,
      format: SaveFormat.JPEG
    });
    return new Uint8Array(
      await fs.promises.readFile(result.uri.replace(/^file:\/\//, ""))
    );
  }
};
