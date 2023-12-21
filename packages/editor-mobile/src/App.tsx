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

import { Global, css } from "@emotion/react";
import {
  ScopedThemeProvider,
  themeToCSS,
  useThemeEngineStore
} from "@notesnook/theme";
import { useEffect, useMemo } from "react";
import { Freeze } from "react-freeze";
import "./App.css";
import Tiptap from "./components/editor";
import { TabContext, useTabStore } from "./hooks/useTabStore";
import { EmotionEditorTheme } from "./theme-factory";
import { EventTypes, getTheme } from "./utils";

const currentTheme = getTheme();
if (currentTheme) {
  useThemeEngineStore.getState().setTheme(currentTheme);
}

function App(): JSX.Element {
  const tabs = useTabStore((state) => state.tabs);
  const currentTab = useTabStore((state) => state.currentTab);

  useEffect(() => {
    post(EventTypes.tabsChanged, {
      tabs: tabs,
      currentTab: currentTab
    });
  }, [tabs, currentTab]);

  logger("info", "opened tabs count", tabs);

  return (
    <ScopedThemeProvider value="base">
      <EmotionEditorTheme>
        <GlobalStyles />
        {tabs.map((tab) => (
          <TabContext.Provider key={tab.id} value={tab}>
            <Freeze freeze={currentTab !== tab.id}>
              <Tiptap />
            </Freeze>
          </TabContext.Provider>
        ))}
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
