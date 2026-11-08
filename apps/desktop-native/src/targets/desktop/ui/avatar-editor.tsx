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

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Image, View } from "react-native";
import { SvgXml } from "react-native-svg";
import fs from "@react-native-gpui/fs";
import {
  manipulateAsync,
  SaveFormat
} from "@react-native-gpui/image-manipulator";
import type * as Contract from "../../../ui/avatar-editor";

const AnyView = View as any;

function toUri(image: string) {
  return image.startsWith("data:") || image.includes("://")
    ? image
    : `file://${image}`;
}

function mask(
  size: number,
  border: number,
  radius: number,
  color: [number, number, number] | [number, number, number, number]
) {
  const [r, g, b, a = 255] = color;
  const inner = size - border * 2;
  const rx = Math.min(radius, inner / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><path fill-rule="evenodd" fill="rgba(${r},${g},${b},${
    a / 255
  })" d="M0 0H${size}V${size}H0Z M${border + rx} ${border}H${
    size - border - rx
  }A${rx} ${rx} 0 0 1 ${size - border} ${border + rx}V${
    size - border - rx
  }A${rx} ${rx} 0 0 1 ${size - border - rx} ${size - border}H${
    border + rx
  }A${rx} ${rx} 0 0 1 ${border} ${size - border - rx}V${
    border + rx
  }A${rx} ${rx} 0 0 1 ${border + rx} ${border}Z"/></svg>`;
}

export const AvatarEditor = forwardRef<
  Contract.AvatarEditorHandle,
  Contract.AvatarEditorProps
>(function AvatarEditor(props, ref) {
  const {
    image,
    width,
    height,
    border = 1,
    borderRadius = 256,
    color = [255, 255, 255],
    scale = 1,
    style = { width: width + border * 2, height: height + border * 2 }
  } = props;
  const [natural, setNatural] = useState<{ width: number; height: number }>();
  const canvas = width + border * 2;
  const factor = style.width / canvas;

  useEffect(() => {
    setNatural(undefined);
    Image.getSize(
      toUri(image),
      (w, h) => setNatural({ width: w, height: h }),
      () => {}
    );
  }, [image]);

  useImperativeHandle(
    ref,
    () => ({
      async getScaledImage({ quality }) {
        if (!natural) throw new Error("The image has not loaded yet");
        const cover = Math.max(width / natural.width, height / natural.height);
        const visibleWidth = width / (cover * scale);
        const visibleHeight = height / (cover * scale);
        const result = await manipulateAsync(
          toUri(image),
          [
            {
              crop: {
                originX: Math.max(0, (natural.width - visibleWidth) / 2),
                originY: Math.max(0, (natural.height - visibleHeight) / 2),
                width: Math.min(natural.width, visibleWidth),
                height: Math.min(natural.height, visibleHeight)
              }
            },
            { resize: { width, height } }
          ],
          { compress: quality, format: SaveFormat.JPEG, base64: true }
        );
        void fs;
        return `data:image/jpeg;base64,${result.base64}`;
      }
    }),
    [image, natural, scale, width, height]
  );

  const cover = natural
    ? Math.max(width / natural.width, height / natural.height) * scale
    : 1;
  return (
    <AnyView
      testID={props.testID}
      style={{
        width: style.width,
        height: style.height,
        overflow: "hidden",
        alignSelf: "center"
      }}
    >
      {natural ? (
        <Image
          source={{ uri: toUri(image) }}
          style={{
            position: "absolute",
            width: natural.width * cover * factor,
            height: natural.height * cover * factor,
            left: (style.width - natural.width * cover * factor) / 2,
            top: (style.height - natural.height * cover * factor) / 2
          }}
        />
      ) : null}
      <SvgXml
        xml={mask(canvas, border, borderRadius, color)}
        width={style.width}
        height={style.height}
        style={{ position: "absolute", left: 0, top: 0 }}
      />
    </AnyView>
  );
});
