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

import { useEffect, useMemo, useRef, useState } from "react";
import { colord } from "colord";
import { PopupWrapper } from "../../components/popup-presenter/index.js";
import { config } from "../../utils/config.js";
import { SplitButton } from "../components/split-button.js";
import { ColorPicker } from "../popups/color-picker.js";
import {
  usePopupManager,
  useToolbarLocation
} from "../stores/toolbar-store.js";
import { ToolProps } from "../types.js";
import { getEditorToolbarPopup } from "../utils/dom.js";
import { PositionOptions } from "@notesnook/ui";
import { strings } from "@notesnook/intl";

type ColorType = "background" | "text" | "border";
type ColorToolProps = ToolProps & {
  onColorChange: (color?: string) => void;
  activeColor?: string;
  title: string;
  cacheKey: string;
  type: ColorType;
};

const DEFAULT_COLORS: Record<ColorType, string[]> = {
  background: [
    "#b0bec5", // Neutralized pink
    "#a1887f", // Neutralized purple
    "#9575cd", // Neutralized deep purple
    "#7986cb", // Neutralized indigo
    "#64b5f6", // Neutralized blue
    "#4fc3f7", // Neutralized light blue
    "#4dd0e1", // Neutralized cyan
    "#4db6ac", // Neutralized teal
    "#81c784", // Neutralized green
    "#aed581", // Neutralized light green
    "#dce775", // Neutralized lime
    "#fff176", // Neutralized yellow
    "#ffd54f", // Neutralized amber
    "#e57373" // Neutralized red
  ],
  text: [
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffc107",
    "#f44336"
  ],
  border: [
    "#ef5350", // Crimson Red
    "#ab47bc", // Lavender Purple
    "#42a5f5", // Sky Blue
    "#26c6da", // Aqua Green
    "#ffca28", // Amber Yellow
    "#ffa726", // Tangerine
    "#66bb6a", // Spring Green
    "#ec407a", // Rose Pink
    "#ff7043", // Coral Orange
    "#dce775", // Bright Lime
    "#5c6bc0", // Soft Indigo
    "#00bcd4", // Cyan
    "#80cbc4"
  ] // Bright Mint
};

export function ColorTool(props: ColorToolProps) {
  const {
    onColorChange,
    activeColor: _activeColor,
    title,
    cacheKey,
    type,
    parentGroup,
    ...toolProps
  } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const defaultColors = DEFAULT_COLORS[type];
  const activeColor = _activeColor || config.get(cacheKey);
  const tColor = activeColor ? colord(activeColor) : undefined;
  const isBottom = useToolbarLocation() === "bottom";
  const { toggle, isOpen, close, isPinned, togglePinned } = usePopupManager({
    id: props.icon,
    group: "color",
    parent: parentGroup
  });
  const [colors, setColors] = useState(
    config.get<string[]>(`custom_${cacheKey}`, []) || []
  );
  const position: PositionOptions = useMemo(
    () => ({
      isTargetAbsolute: true,
      target: isBottom ? getEditorToolbarPopup() : buttonRef.current || "mouse",
      align: isBottom ? "center" : "start",
      location: isBottom ? "top" : "below",
      yOffset: 10
    }),
    [isBottom, isOpen]
  );

  useEffect(() => {
    config.set(`custom_${cacheKey}`, colors);
  }, [cacheKey, colors]);

  return (
    <SplitButton
      {...toolProps}
      buttonRef={buttonRef}
      iconColor={activeColor && tColor?.isDark() ? "white" : "icon"}
      sx={{
        mr: 0,
        bg: activeColor || "transparent",
        ":hover:not(:disabled):not(:active)": {
          bg: tColor ? tColor.darken().toRgbString() : "transparent"
        }
      }}
      onOpen={toggle}
      toggled={isOpen}
      onClick={() => onColorChange(activeColor)}
    >
      <PopupWrapper
        id={props.icon}
        group={"color"}
        position={position}
        focusOnRender={false}
        blocking={false}
      >
        <ColorPicker
          color={activeColor}
          editor={props.editor}
          colors={colors}
          defaultColors={defaultColors}
          onDelete={(color) => {
            if (defaultColors.includes(color)) return;
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
            const currentColor = config.get(cacheKey);
            if (currentColor && currentColor === color) {
              onColorChange();
              config.set(cacheKey, null);
            } else {
              onColorChange(color);
              config.set(cacheKey, color);
            }
          }}
          onClose={close}
          isPinned={isPinned}
          onPin={togglePinned}
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
      title={strings.backgroundColor()}
      type="background"
      onColorChange={(color) =>
        color
          ? editor.chain().setHighlight(color).run()
          : editor.chain().unsetHighlight().run()
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
      title={strings.textColor()}
      type="text"
      onColorChange={(color) =>
        color
          ? editor.chain().setColor(color).run()
          : editor.chain().unsetColor().run()
      }
    />
  );
}
