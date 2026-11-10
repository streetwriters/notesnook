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

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<
    { x: number; y: number; originX: number; originY: number } | undefined
  >(undefined);
  const canvas = width + border * 2;
  const factor = style.width / canvas;
  const cover = natural
    ? Math.max(width / natural.width, height / natural.height) * scale
    : 1;
  const shownWidth = natural ? natural.width * cover * factor : 0;
  const shownHeight = natural ? natural.height * cover * factor : 0;
  const limitX = Math.max(0, (shownWidth - style.width) / 2);
  const limitY = Math.max(0, (shownHeight - style.height) / 2);
  const clampedX = Math.max(-limitX, Math.min(limitX, pan.x));
  const clampedY = Math.max(-limitY, Math.min(limitY, pan.y));

  useEffect(() => {
    setPan({ x: 0, y: 0 });
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
        const fit = Math.max(width / natural.width, height / natural.height);
        const visibleWidth = width / (fit * scale);
        const visibleHeight = height / (fit * scale);
        const sourceX = clampedX / (factor * fit * scale);
        const sourceY = clampedY / (factor * fit * scale);
        const result = await manipulateAsync(
          toUri(image),
          [
            {
              crop: {
                originX: Math.max(
                  0,
                  Math.min(
                    natural.width - visibleWidth,
                    (natural.width - visibleWidth) / 2 - sourceX
                  )
                ),
                originY: Math.max(
                  0,
                  Math.min(
                    natural.height - visibleHeight,
                    (natural.height - visibleHeight) / 2 - sourceY
                  )
                ),
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
    [image, natural, scale, width, height, clampedX, clampedY, factor]
  );

  return (
    <AnyView
      testID={props.testID}
      onPointerDown={(event: {
        nativeEvent: { pageX: number; pageY: number };
      }) => {
        drag.current = {
          x: event.nativeEvent.pageX,
          y: event.nativeEvent.pageY,
          originX: clampedX,
          originY: clampedY
        };
      }}
      onPointerMove={(event: {
        nativeEvent: { pageX: number; pageY: number };
      }) => {
        const start = drag.current;
        if (!start) return;
        setPan({
          x: start.originX + event.nativeEvent.pageX - start.x,
          y: start.originY + event.nativeEvent.pageY - start.y
        });
      }}
      onPointerUp={() => {
        drag.current = undefined;
      }}
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
            width: shownWidth,
            height: shownHeight,
            left: (style.width - shownWidth) / 2 + clampedX,
            top: (style.height - shownHeight) / 2 + clampedY
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
