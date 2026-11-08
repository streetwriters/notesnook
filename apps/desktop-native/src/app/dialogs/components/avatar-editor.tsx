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

import { forwardRef, useImperativeHandle } from "react";
import { Flex, Image } from "@ui";

export type AvatarEditorProps = {
  image: string;
  width: number;
  height: number;
  border?: number;
  borderRadius?: number;
  color?: [number, number, number] | [number, number, number, number];
  scale?: number;
  style?: { width: number; height: number };
};

export type AvatarEditorRef = {
  getScaledImage(options: {
    type: "image/jpeg";
    quality: number;
  }): Promise<string>;
};

export const AvatarEditor = forwardRef<AvatarEditorRef, AvatarEditorProps>(
  function AvatarEditor(props, ref) {
    useImperativeHandle(
      ref,
      () => ({ getScaledImage: async () => props.image }),
      [props.image]
    );
    const size = props.style ?? { width: props.width, height: props.height };
    return (
      <Flex
        sx={{
          width: size.width,
          height: size.height,
          borderRadius: size.width,
          overflow: "hidden",
          alignSelf: "center"
        }}
      >
        <Image
          src={props.image}
          resizeMode="cover"
          sx={{ width: size.width, height: size.height }}
        />
      </Flex>
    );
  }
);
