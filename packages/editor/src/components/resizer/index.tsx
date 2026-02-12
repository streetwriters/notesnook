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

import { SchemeColors } from "@notesnook/theme";
import { Resizable } from "re-resizable";
import { PropsWithChildren } from "react";
import { Icons } from "../../toolbar/index.js";
import { Icon } from "@notesnook/ui";
import { Flex } from "@theme-ui/components";
import { getEditorDOM } from "../../toolbar/utils/dom.js";

type ResizerProps = {
  enabled: boolean;
  selected: boolean;
  width?: number;
  height?: number;
  handleColor?: SchemeColors;
  onResize: (width: number, height: number) => void;
  onResizeStop?: (width: number, height: number) => void;
  style?: React.CSSProperties;
  lockAspectRation?: boolean;
};
export function Resizer(props: PropsWithChildren<ResizerProps>) {
  const {
    enabled,
    selected,
    onResize,
    onResizeStop,
    width,
    height,
    children,
    handleColor,
    style,
    lockAspectRation = true
  } = props;

  if (!enabled)
    return <Flex sx={{ position: "relative", width }}>{children}</Flex>;

  return (
    <Resizable
      style={style}
      enable={{
        bottom: false,
        left: false,
        right: false,
        top: false,
        bottomLeft: false,
        bottomRight: selected,
        topLeft: false,
        topRight: false
      }}
      size={{
        height: height || "auto",
        width: width || "auto"
      }}
      className="resizer"
      maxWidth={"100%"}
      bounds={getEditorDOM()}
      minWidth={135}
      handleStyles={{
        bottomRight: {
          right: 0,
          bottom: 0,
          width: 30,
          height: 30,
          zIndex: 2
        }
      }}
      handleComponent={{
        bottomRight: (
          <Icon
            sx={{
              width: 25,
              height: 25
            }}
            path={Icons.resize}
            size={25}
            color={handleColor || "black"}
          />
        )
      }}
      onResize={(_e, _direction, ref) => {
        try {
          onResize(ref.clientWidth, ref.clientHeight);
        } catch {
          // ignore
        }
      }}
      onResizeStop={(_e, _direction, ref) => {
        try {
          onResizeStop?.(ref.clientWidth, ref.clientHeight);
        } catch {
          // ignore
        }
      }}
      onResizeStart={(e) => e.preventDefault()}
      lockAspectRatio={lockAspectRation}
    >
      {children}
    </Resizable>
  );
}
