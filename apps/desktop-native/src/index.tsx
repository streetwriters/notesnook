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

import "./targets/desktop";
import { useState } from "react";
import { THEME_DARK, THEME_LIGHT } from "./app/common/theme";
import { Root, type RootProps } from "./app/root";
import { useStore as useThemeStore } from "./app/stores/theme-store";
import { DesktopThemeProvider } from "./targets/desktop/ui";

export default function App(
  props: Omit<RootProps, "colorScheme" | "onToggleColorScheme"> & {
    initialColorScheme?: "light" | "dark";
  }
) {
  useState(() => {
    if (props.initialColorScheme)
      useThemeStore.setState({ colorScheme: props.initialColorScheme });
  });
  const colorScheme = useThemeStore((store) => store.colorScheme);
  return (
    <DesktopThemeProvider
      theme={colorScheme === "dark" ? THEME_DARK : THEME_LIGHT}
    >
      <Root
        {...props}
        colorScheme={colorScheme}
        onToggleColorScheme={() =>
          useThemeStore.setState({
            colorScheme: colorScheme === "dark" ? "light" : "dark"
          })
        }
      />
    </DesktopThemeProvider>
  );
}
