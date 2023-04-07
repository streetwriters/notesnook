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
import { Dimensions, Platform } from "react-native";
import ImageResizer from "@bam.tech/react-native-image-resizer";
import RNFetchBlob from "rn-fetch-blob";
/**
 * Scale down & compress images to screen width
 * for loading in editor.
 * @returns
 */
export async function compressToBase64(path, type) {
  const { width, scale } = Dimensions.get("window");
  const response = await ImageResizer.createResizedImage(
    path,
    width * scale,
    9999,
    type,
    80,
    0,
    undefined,
    true,
    {
      mode: "contain",
      onlyScaleDown: true
    }
  );
  const base64 = await RNFetchBlob.fs.readFile(
    Platform.OS === "ios" ? response.uri?.replace("file://", "") : response.uri,
    "base64"
  );
  RNFetchBlob.fs.unlink(path.replace("file://", "")).catch(console.log);
  RNFetchBlob.fs.unlink(response.uri.replace("file://", "")).catch(console.log);
  return base64;
}
