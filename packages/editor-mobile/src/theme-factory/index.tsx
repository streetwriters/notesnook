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
import { PropsWithChildren, useMemo } from "react";
import { Theme, ThemeFactory, useThemeColors } from "@notesnook/theme";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";

const modifyToolbarTheme = (toolbarTheme: Theme) => {
  toolbarTheme.space = [0, 10, 12, 18];
  toolbarTheme.space.small = "10px";

  toolbarTheme.buttons.menuitem = {
    ...toolbarTheme.buttons.menuitem,
    height: "50px",
    paddingX: "20px",
    borderBottomWidth: 0
  };

  toolbarTheme.iconSizes = {
    big: 20,
    medium: 18,
    small: 18
  };
  toolbarTheme.fontSizes = {
    ...toolbarTheme.fontSizes,
    subBody: "0.8rem",
    body: "0.9rem"
  };

  toolbarTheme.radii = {
    ...toolbarTheme.radii,
    small: 5
  };

  toolbarTheme.buttons.menuitem = {
    ...toolbarTheme.buttons.menuitem,
    px: 5,
    height: "45px"
  };
};

export const EmotionEditorToolbarTheme = (props: PropsWithChildren<any>) => {
  const { colors, isDark } = useThemeColors("editorToolbar");
  const theme = useMemo(
    () =>
      ThemeFactory.construct({
        colorScheme: isDark ? "dark" : "light",
        scope: colors
      }),
    [colors, isDark]
  );
  modifyToolbarTheme(theme);
  console.log(theme);
  return (
    <EmotionThemeProvider theme={theme}>{props.children}</EmotionThemeProvider>
  );
};

export const EmotionEditorTheme = (props: PropsWithChildren<any>) => {
  const { colors, isDark } = useThemeColors("editor");
  const theme = useMemo(
    () =>
      ThemeFactory.construct({
        colorScheme: isDark ? "dark" : "light",
        scope: colors
      }),
    [colors, isDark]
  );
  theme.colors.background = colors.primary.background || "#f0f0f0";
  theme.space = [0, 10, 12, 20];
  return (
    <EmotionThemeProvider theme={theme}>{props.children}</EmotionThemeProvider>
  );
};
