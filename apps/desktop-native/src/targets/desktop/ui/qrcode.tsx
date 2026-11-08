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

import { forwardRef, useImperativeHandle, useMemo } from "react";
import qrcode from "qrcode-generator";
import fs from "@react-native-gpui/fs";
import {
  manipulateAsync,
  SaveFormat
} from "@react-native-gpui/image-manipulator";
import { SvgXml } from "react-native-svg";
import type * as Contract from "../../../ui/primitives";
import { useThemeContext } from "./theme";

function buildSvg(
  value: string,
  size: number,
  ecLevel: "L" | "M" | "Q" | "H",
  foreground: string,
  background: string
) {
  const code = qrcode(0, ecLevel);
  code.addData(value);
  code.make();
  const count = code.getModuleCount();
  let path = "";
  for (let row = 0; row < count; row++)
    for (let column = 0; column < count; column++)
      if (code.isDark(row, column)) path += `M${column},${row}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${count} ${count}" shape-rendering="crispEdges"><rect width="${count}" height="${count}" fill="${background}"/><path d="${path}" fill="${foreground}"/></svg>`;
}

export const QRCode = forwardRef<Contract.QRCodeHandle, Contract.QRCodeProps>(
  function QRCode(props, ref) {
    const { colors } = useThemeContext();
    const { value, size, ecLevel = "M" } = props;
    const xml = useMemo(
      () => buildSvg(value, size, ecLevel, "#000000", "#ffffff"),
      [value, size, ecLevel]
    );
    void colors;

    useImperativeHandle(
      ref,
      () => ({
        toSVG: () => xml,
        async toPNG() {
          const result = await manipulateAsync(
            `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`,
            [{ resize: { width: size * 4 } }],
            { format: SaveFormat.PNG }
          );
          return new Uint8Array(
            await fs.promises.readFile(result.uri.replace(/^file:\/\//, ""))
          );
        }
      }),
      [xml, size]
    );

    return <SvgXml xml={xml} width={size} height={size} />;
  }
);
