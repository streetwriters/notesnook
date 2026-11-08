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

import { useEffect, type ReactNode } from "react";
import { Flex, ThemeScope, type SxProp, type ThemeScopeName } from "@ui";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useSystemTheme } from "../../hooks/use-system-theme";

export function BaseThemeProvider(props: {
  scope?: ThemeScopeName;
  onRender?: () => void;
  sx?: SxProp;
  children?: ReactNode;
}) {
  const { children, scope = "base", onRender, sx } = props;
  const isSystemThemeDark = useSystemTheme();
  const setColorScheme = useThemeStore((store) => store.setColorScheme);
  const followSystemTheme = useThemeStore((store) => store.followSystemTheme);

  useEffect(() => {
    if (!followSystemTheme) return;
    setColorScheme(isSystemThemeDark ? "dark" : "light");
  }, [isSystemThemeDark, followSystemTheme, setColorScheme]);

  useEffect(() => {
    useThemeStore.getState().init();
  }, []);

  useEffect(() => {
    onRender?.();
  }, [onRender]);

  return (
    <ThemeScope scope={scope}>
      <Flex sx={sx}>{children}</Flex>
    </ThemeScope>
  );
}

export function ScopedThemeProvider(props: {
  scope?: ThemeScopeName;
  sx?: SxProp;
  children?: ReactNode;
}) {
  const { scope = "base", sx, children } = props;
  return (
    <ThemeScope scope={scope}>
      <Flex sx={sx}>{children}</Flex>
    </ThemeScope>
  );
}
