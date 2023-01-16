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

import { useStore } from "../../stores/theme-store";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { useTheme } from "@notesnook/theme";
import { useEffect } from "react";

function ThemeProviderWrapper(props) {
  const theme = useStore((store) => store.theme);
  const accent = useStore((store) => store.accent);
  const themeProperties = useTheme({ accent, theme });

  useEffect(() => {
    const root = document.querySelector("html");
    if (root) root.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <EmotionThemeProvider theme={themeProperties}>
      {props.children instanceof Function
        ? props.children(themeProperties)
        : props.children}
    </EmotionThemeProvider>
  );
}
export default ThemeProviderWrapper;
