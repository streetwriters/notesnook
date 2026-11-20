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
  Button,
  ColorPicker as UIColorPicker,
  ColorValue,
  dataColor,
  Flex,
  Icon,
  Input,
  SxProp
} from "@ui";
import { Icons } from "../icons.js";
import { useCallback, useState } from "react";
import { colord } from "colord";
import { debounce } from "../../utils/debounce.js";
import { Popup } from "../components/popup.js";
import { strings } from "@notesnook/intl";

type ColorPickerProps = {
  colors?: string[];
  defaultColors?: string[];
  color?: string;
  onClear: () => void;
  expanded?: boolean;
  onChange: (color: string) => void;
  onClose?: () => void;
  isPinned?: boolean;
  onPin?: () => void;
  title?: string;
  onSave?: (color: string) => void;
  cacheKey?: string;
  onDelete?: (color: string) => void;
};
const PALETTE_SIZE = 25;
const WHITE = dataColor("#ffffff");

export function toDataColor(color?: string): ColorValue | undefined {
  if (!color) return undefined;
  const c = colord(color);
  if (!c.isValid()) return undefined;
  return dataColor(c.toHex());
}

export function ColorPicker(props: ColorPickerProps) {
  const {
    color,
    onClear,
    onChange,
    title,
    onClose,
    isPinned,
    onPin,
    expanded,
    onSave,
    colors = [],
    defaultColors = [],
    onDelete
  } = props;
  const [isPickerOpen, setIsPickerOpen] = useState(expanded || false);
  const [currentColor, setCurrentColor] = useState<string>(
    colord(color || colors?.[0]).toHex()
  );
  const [deleteMode, setDeleteMode] = useState(false);
  const tColor = colord(currentColor);
  const allColors = deleteMode ? colors : [...defaultColors, ...colors];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onColorChange = useCallback(
    debounce((color: string) => {
      onChange(color);
    }, 500),
    [onChange]
  );

  return (
    <Popup title={title} onClose={onClose} isPinned={isPinned} onPin={onPin}>
      <Flex
        sx={{
          bg: "background",
          flexDirection: "column",
          width: 250
        }}
      >
        {isPickerOpen ? (
          <>
            <UIColorPicker
              testID="color-picker-custom"
              value={currentColor}
              onChange={(color) => {
                setCurrentColor(color);
                onColorChange(color);
              }}
            />
            <Flex
              sx={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Input
                testID="color-picker-hex"
                key={currentColor}
                variant={"clean"}
                placeholder="#000000"
                sx={{
                  my: 2,
                  p: 0,
                  borderRadius: 0,
                  fontSize: "body",
                  color: "paragraph-secondary",
                  width: 75,
                  letterSpacing: 1.5,
                  textAlign: "center"
                }}
                defaultValue={currentColor.toUpperCase()}
                maxLength={7}
                onChangeText={(value) => {
                  if (!value) return;
                  if (colord(value).isValid()) {
                    setCurrentColor(value);
                    onChange(value);
                  }
                }}
              />
              {onSave && (
                <PaletteButton
                  testID="color-picker-save"
                  disabled={allColors.includes(currentColor)}
                  icon={Icons.save}
                  iconSize={18}
                  onClick={() => onSave(currentColor)}
                  title={strings.save()}
                />
              )}
            </Flex>
          </>
        ) : null}
        <Flex sx={{ flexDirection: "row" }}>
          <Flex
            sx={{
              flex: 1,
              flexDirection: "row",
              p: 1,
              flexWrap: "wrap",
              maxHeight: 200
            }}
          >
            {!deleteMode && (
              <PaletteButton
                testID="color-picker-clear"
                icon={Icons.colorClear}
                onClick={onClear}
                title={strings.clear()}
                iconSize={15}
              />
            )}
            <PaletteButton
              testID="color-picker-delete-mode"
              icon={Icons.delete}
              iconColor={deleteMode ? "icon-error" : "icon"}
              bg={deleteMode ? "background-error" : "transparent"}
              onClick={() => setDeleteMode((s) => !s)}
              title={strings.deleteMode()}
              iconSize={18}
            />
            {!deleteMode && (
              <PaletteButton
                testID="color-picker-palette"
                icon={Icons.palette}
                iconColor={tColor.isDark() ? WHITE : "icon"}
                onClick={() => setIsPickerOpen((s) => !s)}
                title={strings.chooseCustomColor()}
                iconSize={18}
                bg={toDataColor(currentColor)}
              />
            )}
            {allColors.map((colorItem) => (
              <PaletteButton
                testID={`color-${colorItem}`}
                key={colorItem}
                title={deleteMode ? strings.clickToRemove() : colorItem}
                bg={toDataColor(colorItem)}
                iconSize={15}
                iconColor={WHITE}
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
              />
            ))}
          </Flex>
        </Flex>
      </Flex>
    </Popup>
  );
}

type PaletteButtonProps = {
  testID?: string;
  title?: string;
  disabled?: boolean;
  onClick: () => void;
  icon?: string;
  iconColor?: ColorValue;
  iconSize?: number;
  bg?: ColorValue;
  sx?: SxProp;
};
function PaletteButton(props: PaletteButtonProps) {
  const {
    sx,
    iconColor,
    icon,
    iconSize = 20,
    bg,
    onClick,
    testID,
    title,
    disabled
  } = props;
  return (
    <Button
      testID={testID}
      title={title}
      disabled={disabled}
      focusable={false}
      variant={"icon"}
      onPress={onClick}
      sx={{
        flexShrink: 0,
        width: PALETTE_SIZE,
        height: PALETTE_SIZE,
        borderRadius: 50,
        boxShadow: "menu",
        p: 0,
        ml: 1,
        mb: 1,
        alignItems: "center",
        justifyContent: "center",
        bg,
        ...sx
      }}
    >
      {icon && <Icon path={icon} color={iconColor} size={iconSize} />}
    </Button>
  );
}
