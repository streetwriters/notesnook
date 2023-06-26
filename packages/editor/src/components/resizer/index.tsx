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

import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import { Resizable } from "re-resizable";
import { PropsWithChildren } from "react";
import { Icon, Icons } from "../../toolbar";
import { Editor } from "../../types";
import { Flex } from "@theme-ui/components";

type ResizerProps = {
  editor: Editor;
  selected: boolean;
  width?: number;
  height?: number;
  handleColor?: keyof SchemeColors;
  onResize: (width: number, height: number) => void;
  style?: React.CSSProperties;
};
export function Resizer(props: PropsWithChildren<ResizerProps>) {
  const {
    editor,
    selected,
    onResize,
    width,
    height,
    children,
    handleColor,
    style
  } = props;

  if (!editor.isEditable)
    return <Flex sx={{ position: "relative" }}>{children}</Flex>;

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
      maxWidth="100%"
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
      onResizeStop={(_e, _direction, ref) => {
        try {
          onResize(ref.clientWidth, ref.clientHeight);
        } catch {
          // ignore
        }
      }}
      lockAspectRatio={true}
    >
      {children}
    </Resizable>
  );
}
