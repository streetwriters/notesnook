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

import { ButtonProps, Flex } from "@theme-ui/components";
import { Input } from "@theme-ui/components";
import { Icon } from "@notesnook/ui";
import { Icons } from "../icons";
import { useCallback, useEffect, useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { HexColorPicker } from "react-colorful";
import { Button } from "../../components/button";
import { debounce } from "../../utils/debounce";
import { Popup } from "../components/popup";
import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import { EmotionThemeVariant } from "@notesnook/theme";

export const DEFAULT_COLORS = [
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
  "#ffeb3b",
  "#ffc107",
  "#f44336"
];

type ColorPickerProps = {
  colors?: string[];
  color?: string;
  onClear: () => void;
  expanded?: boolean;
  onChange: (color: string) => void;
  onClose?: () => void;
  title?: string;
  onSave?: (color: string) => void;
  cacheKey?: string;
  onDelete?: (color: string) => void;
};
const PALETTE_SIZE = [35, 35, 25];
export function ColorPicker(props: ColorPickerProps) {
  const {
    color,
    onClear,
    onChange,
    title,
    onClose,
    expanded,
    onSave,
    colors = [],
    onDelete
  } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(expanded || false);
  const [currentColor, setCurrentColor] = useState<string>(
    tinycolor(color || colors?.[0]).toHexString()
  );
  const [deleteMode, setDeleteMode] = useState(false);
  const tColor = tinycolor(currentColor);
  const allColors = deleteMode ? colors : [...DEFAULT_COLORS, ...colors];

  useEffect(() => {
    if (!ref.current) return;
    if (isPickerOpen) ref.current.focus({ preventScroll: true });
  }, [isPickerOpen]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onColorChange = useCallback(
    debounce((color: string) => {
      onChange(color);
    }, 500),
    [onChange]
  );

  return (
    <Popup title={title} onClose={onClose}>
      <Flex
        ref={ref}
        tabIndex={-1}
        sx={{
          bg: "background",
          flexDirection: "column",
          ".react-colorful": {
            width: "auto",
            height: 150
          },
          ".react-colorful__saturation": {
            borderRadius: ["default", 0]
          },
          width: ["calc(100vw - 20px)", 250]
          //  width: ["auto", 250],
        }}
      >
        {isPickerOpen ? (
          <>
            <HexColorPicker
              color={currentColor}
              onChange={(color) => {
                setCurrentColor(color);
                onColorChange(color);
              }}
              onTouchEnd={() => onChange(currentColor)}
              onMouseUp={() => onChange(currentColor)}
            />
            <Flex
              sx={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Input
                variant={"clean"}
                placeholder="#000000"
                spellCheck={false}
                sx={{
                  my: 2,
                  p: 0,
                  borderRadius: 0,
                  fontSize: ["title", "title", "body"],
                  color: "paragraph",
                  width: [75, 75, 65],
                  letterSpacing: 1.5,
                  textAlign: "center"
                }}
                value={currentColor.toUpperCase()}
                maxLength={7}
                onChange={(e) => {
                  const { value } = e.target;
                  if (!value) return;
                  if (tinycolor(value, { format: "hex" }).isValid()) {
                    setCurrentColor(value);
                    onChange(value);
                  }
                }}
              />
              {onSave && (
                <PaletteButton
                  sx={{
                    boxShadow: "none"
                  }}
                  disabled={allColors.includes(currentColor)}
                  icon={Icons.save}
                  iconSize={18}
                  onClick={() => onSave(currentColor)}
                  title="Save color"
                />
              )}
            </Flex>
          </>
        ) : null}
        <Flex>
          <Flex
            className="hide-scrollbar"
            sx={{
              flex: 1,
              p: 1,
              overflowX: ["auto", "hidden"],
              flexWrap: ["nowrap", "wrap"],
              maxHeight: ["auto", 100],
              overflowY: ["hidden", "auto"]
            }}
          >
            {!deleteMode && (
              <PaletteButton
                icon={Icons.colorClear}
                onClick={onClear}
                title="Clear color"
                iconSize={15}
              />
            )}
            <EmotionThemeVariant variant={deleteMode ? "error" : "primary"}>
              <PaletteButton
                icon={Icons.delete}
                iconColor={"icon"}
                bg={deleteMode ? "background" : "transparent"}
                onClick={() => setDeleteMode((s) => !s)}
                title={
                  deleteMode
                    ? "Disable delete mode"
                    : "Enable delete mode for deleting custom colors"
                }
                iconSize={18}
              />
            </EmotionThemeVariant>
            {!deleteMode && (
              <PaletteButton
                icon={Icons.palette}
                iconColor={tColor.isDark() ? "white" : "icon"}
                onClick={() => setIsPickerOpen((s) => !s)}
                title="Choose custom color"
                iconSize={18}
                bg={currentColor}
              />
            )}
            {allColors.map((colorItem) => (
              <PaletteButton
                key={colorItem}
                title={deleteMode ? "Click to delete this color" : colorItem}
                bg={colorItem}
                iconSize={15}
                iconColor={"white"}
                icon={
                  deleteMode && colors.includes(colorItem)
                    ? Icons.close
                    : undefined
                }
                onClick={() => {
                  if (deleteMode) {
                    onDelete?.(colorItem);
                    return;
                  }
                  setCurrentColor(colorItem);
                  onChange(colorItem);
                }}
                sx={{ mb: [0, 1, 1] }}
              />
            ))}
          </Flex>
          {onClose && (
            <Button
              variant={"icon"}
              sx={{ display: ["block", "none"], px: 2 }}
              onClick={onClose}
            >
              <Icon path={Icons.close} size="big" />
            </Button>
          )}
        </Flex>
      </Flex>
    </Popup>
  );
}

type PaletteButtonProps = ButtonProps & {
  icon?: string;
  iconColor?: SchemeColors;
  iconSize?: number;
  bg?: string;
};
function PaletteButton(props: PaletteButtonProps) {
  const { sx, iconColor, icon, iconSize = 20, bg, ...restProps } = props;
  return (
    <Button
      variant={"icon"}
      sx={{
        flexShrink: 0,
        width: PALETTE_SIZE,
        height: PALETTE_SIZE,
        borderRadius: 50,
        boxShadow: "menu",
        p: 0,
        ml: [2, 2, 1],
        bg,
        ":hover": { bg },
        ...sx
      }}
      {...restProps}
    >
      {icon && <Icon path={icon} color={iconColor} size={iconSize} />}
    </Button>
  );
}
