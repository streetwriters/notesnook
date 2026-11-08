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

import { useEffect, useRef, useState } from "react";
import {
  Flex,
  Pane,
  SplitPane,
  Text,
  ThemeScope,
  TITLE_BAR_HEIGHT,
  TitleBar,
  type SplitPaneHandle
} from "@ui";
import { ActionBar } from "./components/action-bar";
import { MenuHost } from "./components/menu";
import { useEditorStore } from "./stores/editor-store";
import CachedRouter from "./components/cached-router";
import { NavigationMenu } from "./components/navigation-menu";
import { StatusBar } from "./components/status-bar";

export function App(props: { titleBarInset?: number }) {
  const navPane = useRef<SplitPaneHandle>(null);
  const [isNavPaneCollapsed, setIsNavPaneCollapsed] = useState(false);

  useEffect(() => {
    if (useEditorStore.getState().tabs.length === 0)
      useEditorStore.getState().newSession();
  }, []);

  return (
    <Flex
      testID="app"
      sx={{ flexDirection: "column", flex: 1, bg: "background" }}
    >
      <ThemeScope scope="titleBar">
        <TitleBar underlay={false}>
          <Flex
            testID="editor-action-bar"
            sx={{
              flexDirection: "row",
              height: TITLE_BAR_HEIGHT,
              bg: "background",
              px: "spacing4",
              borderBottom: "1px solid",
              borderBottomColor: "border"
            }}
          >
            <ActionBar
              leadingInset={props.titleBarInset}
              isSidebarCollapsed={isNavPaneCollapsed}
              onSidebarToggle={() => {
                if (isNavPaneCollapsed) navPane.current?.expand(0);
                else navPane.current?.collapse(0);
              }}
            />
          </Flex>
        </TitleBar>
      </ThemeScope>
      <SplitPane
        ref={navPane}
        onChange={(sizes) => setIsNavPaneCollapsed(sizes[0] === 0)}
        testID="global-split-pane"
        direction="vertical"
        autoSaveId="global-panel-group"
        sx={{ overflow: "hidden" }}
      >
        <Pane
          id="nav-pane"
          initialSize={250}
          snapSize={150}
          minSize={50}
          maxSize={500}
        >
          <ThemeScope scope="navigationMenu">
            <NavigationMenu />
          </ThemeScope>
        </Pane>
        <Pane id="list-pane" initialSize={380} snapSize={120} maxSize={1000}>
          <ThemeScope scope="list">
            <Flex
              sx={{
                flexDirection: "column",
                flex: 1,
                bg: "background",
                borderRight: "1px solid",
                borderRightColor: "separator"
              }}
            >
              <CachedRouter />
            </Flex>
          </ThemeScope>
        </Pane>
        <Pane id="editor-pane">
          <ThemeScope scope="editor">
            <Flex
              testID="editor-placeholder"
              sx={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                bg: "background"
              }}
            >
              <Text sx={{ color: "paragraph-secondary" }}>
                The editor is not implemented on desktop yet
              </Text>
            </Flex>
          </ThemeScope>
        </Pane>
      </SplitPane>
      <StatusBar />
      <MenuHost />
    </Flex>
  );
}
