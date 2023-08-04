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
  ScopedThemeProvider,
  themeToCSS,
  useThemeEngineStore
} from "@notesnook/theme";
import "./App.css";
import Tiptap from "./components/editor";
import { EmotionEditorTheme } from "./theme-factory";
import { Global, css } from "@emotion/react";
import { useMemo } from "react";
import { getTheme } from "./utils";

const currentTheme = getTheme();
if (currentTheme) {
  useThemeEngineStore.getState().setTheme(currentTheme);
}

function App(): JSX.Element {
  return (
    <ScopedThemeProvider value="base">
      <EmotionEditorTheme>
        <GlobalStyles />
        <Tiptap />
      </EmotionEditorTheme>
    </ScopedThemeProvider>
  );
}

export default App;

function GlobalStyles() {
  const theme = useThemeEngineStore((store) => store.theme);
  const cssTheme = useMemo(() => themeToCSS(theme), [theme]);
  return (
    <>
      <Global
        styles={css`
          ${cssTheme}
        `}
      />
    </>
  );
}
