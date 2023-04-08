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

import { useEffect, useMemo, useState } from "react";
import tinycolor from "tinycolor2";
import { PopupWrapper } from "../../components/popup-presenter";
import { config } from "../../utils/config";
import { SplitButton } from "../components/split-button";
import { ColorPicker, DEFAULT_COLORS } from "../popups/color-picker";
import { useToolbarLocation } from "../stores/toolbar-store";
import { ToolProps } from "../types";
import { getToolbarElement } from "../utils/dom";
import { PositionOptions } from "../../utils/position";

type ColorToolProps = ToolProps & {
  onColorChange: (color?: string) => void;
  activeColor: string;
  title: string;
  cacheKey: string;
};

export function ColorTool(props: ColorToolProps) {
  const {
    onColorChange,
    activeColor: _activeColor,
    title,
    cacheKey,
    ...toolProps
  } = props;
  const activeColor = _activeColor || config.get(cacheKey);
  const tColor = tinycolor(activeColor);
  const isBottom = useToolbarLocation() === "bottom";
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [colors, setColors] = useState(
    config.get<string[]>(`custom_${cacheKey}`, []) || []
  );
  const position = useMemo(() => {
    const pos: PositionOptions = {
      isTargetAbsolute: true,
      target: getToolbarElement(),
      align: isBottom ? "center" : "end",
      location: isBottom ? "top" : "below",
      yOffset: 10
    };
    return pos;
  }, [isBottom]);

  useEffect(() => {
    config.set(`custom_${cacheKey}`, colors);
  }, [cacheKey, colors]);

  return (
    <SplitButton
      {...toolProps}
      iconColor={activeColor && tColor.isDark() ? "static" : "icon"}
      sx={{
        mr: 0,
        bg: activeColor || "transparent",
        ":hover": {
          bg: activeColor ? tColor.darken(5).toRgbString() : "transparent"
        }
      }}
      onOpen={() => setIsOpen((s) => !s)}
      toggled={isOpen}
      onClick={() => onColorChange(activeColor)}
    >
      <PopupWrapper
        isOpen={isOpen}
        id={props.icon}
        group={"color"}
        position={position}
        focusOnRender={false}
        blocking={false}
      >
        <ColorPicker
          color={activeColor}
          colors={colors}
          onDelete={(color) => {
            if (DEFAULT_COLORS.includes(color)) return;
            setColors((colors) => colors.filter((item) => item !== color));
          }}
          onClear={() => {
            onColorChange();
            config.set(cacheKey, null);
          }}
          onSave={(color) => {
            setColors((colors) =>
              colors.includes(color) ? colors : [...colors, color]
            );
          }}
          cacheKey={`custom_${cacheKey}`}
          onChange={(color) => {
            onColorChange(color);
            config.set(cacheKey, color);
          }}
          onClose={() => setIsOpen(false)}
          title={title}
        />
      </PopupWrapper>
    </SplitButton>
  );
}

export function Highlight(props: ToolProps) {
  const { editor } = props;
  return (
    <ColorTool
      {...props}
      cacheKey="highlight"
      activeColor={editor.getAttributes("textStyle").backgroundColor}
      title={"Background color"}
      onColorChange={(color) =>
        color
          ? editor.current?.chain().focus().setHighlight(color).run()
          : editor.current?.chain().focus().unsetHighlight().run()
      }
    />
  );
}

export function TextColor(props: ToolProps) {
  const { editor } = props;
  return (
    <ColorTool
      {...props}
      cacheKey={"textColor"}
      activeColor={editor.getAttributes("textStyle").color}
      title="Text color"
      onColorChange={(color) =>
        color
          ? editor.current?.chain().focus().setColor(color).run()
          : editor.current?.chain().focus().unsetColor().run()
      }
    />
  );
}
