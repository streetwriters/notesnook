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

// import { useStore } from "../../stores/theme-store";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { getDefaultAccentColor, ThemeFactory } from "@notesnook/theme";
import { ReactNode } from "react";

type ThemeProviderProps = {
  children: ReactNode;
  accent?: string;
  theme?: "dark" | "light";
};

function ThemeProvider(props: ThemeProviderProps) {
  const { accent, children, theme } = props;
  const themeProperties = new ThemeFactory().construct({
    colorScheme: "dark",

    // TODO:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    variants: {}
  });

  // useEffect(() => {
  //   const root = document.querySelector("html");
  //   if (root) root.setAttribute("data-theme", theme);
  // }, [theme]);

  return (
    <EmotionThemeProvider theme={themeProperties}>
      {children}
    </EmotionThemeProvider>
  );
}
export { ThemeProvider };
