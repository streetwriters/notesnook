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
  TitleBar,
  type SplitPaneHandle,
  DragGhostHost,
  PopoverHost,
  ToastHost,
  type UIElement
} from "@ui";
import { ActionBar } from "./components/action-bar";
import { MenuHost } from "./components/menu";
import { DialogHost } from "./common/dialog-manager";
import { useEditorStore } from "./stores/editor-store";
import CachedRouter from "./components/cached-router";
import { NavigationMenu } from "./components/navigation-menu";
import { StatusBar } from "./components/status-bar";
import { LightboxHost } from "./components/lightbox";
import HashRouter from "./components/hash-router";
import AppEffects from "./app-effects";
import { AppEventManager, AppEvents } from "./common/app-events";
import { NavigationEvents } from "./navigation";
import { useStore } from "./stores/app-store";
import { useDatabaseReady } from "./stores/boot-store";
import useMobile from "./hooks/use-mobile";
import useTablet from "./hooks/use-tablet";
import useSlider from "./hooks/use-slider";
import { useWindowFocus } from "./hooks/use-window-focus";

function EditorPlaceholder() {
  const element = useRef<UIElement>(null);
  const opened = useRef(false);
  const sessionId = useEditorStore((store) => store.getActiveTab()?.sessionId);

  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      return;
    }
    element.current?.focus();
  }, [sessionId]);

  return (
    <Flex
      ref={element}
      testID="editor-placeholder"
      onFocus={() => {}}
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
  );
}

export function App(props: { titleBarInset?: number }) {
  const isMobile = useMobile();
  const isDatabaseReady = useDatabaseReady();
  const isFocusMode = useStore((store) => store.isFocusMode);
  const isNavPaneCollapsed = useStore((store) => store.isNavPaneCollapsed);
  const [isMobileSideMenuOpen, setIsMobileSideMenuOpen] = useState(false);
  const [isMobileEditorActive, setIsMobileEditorActive] = useState(false);
  const navPane = useRef<SplitPaneHandle>(null);

  useEffect(() => {
    if (useEditorStore.getState().tabs.length === 0)
      useEditorStore.getState().newSession();
  }, []);

  useEffect(() => {
    if (isMobile) useStore.setState({ isNavPaneCollapsed: false });
  }, [isMobile]);

  return (
    <Flex
      testID="app"
      sx={{ flexDirection: "column", flex: 1, bg: "background" }}
    >
      {isDatabaseReady ? <AppEffects /> : null}
      <ThemeScope scope="titleBar">
        <TitleBar
          trafficLightInset={props.titleBarInset}
          sx={{
            bg: "background",
            px: "spacing4",
            borderBottom: "1px solid",
            borderBottomColor: "border"
          }}
        >
          <ActionBar
            isSidebarCollapsed={
              isMobile ? !isMobileSideMenuOpen : isNavPaneCollapsed
            }
            onSidebarToggle={() => {
              if (isMobile) {
                const nextOpenState = !isMobileSideMenuOpen;
                setIsMobileSideMenuOpen(nextOpenState);
                AppEventManager.publish(
                  AppEvents.toggleSideMenu,
                  nextOpenState
                );
              } else if (isNavPaneCollapsed) navPane.current?.expand(0);
              else navPane.current?.collapse(0);
            }}
          />
        </TitleBar>
      </ThemeScope>
      {isMobile ? (
        <MobileAppContents
          onSideMenuVisibilityChange={setIsMobileSideMenuOpen}
          onEditorPaneVisibilityChange={setIsMobileEditorActive}
        />
      ) : (
        <DesktopAppContents navPane={navPane} isFocusMode={isFocusMode} />
      )}
      <StatusBar />
      <MenuHost />
      <DialogHost />
      <PopoverHost />
      <ToastHost />
      <DragGhostHost />
      <LightboxHost />
    </Flex>
  );
}

export default App;

function DesktopAppContents(props: {
  navPane: { current: SplitPaneHandle | null };
  isFocusMode: boolean;
}) {
  const { navPane, isFocusMode } = props;
  const isListPaneVisible = useStore((store) => store.isListPaneVisible);
  const isTablet = useTablet();
  const { isFocused } = useWindowFocus();

  useEffect(() => {
    if (isTablet) navPane.current?.collapse(0);
    else if (navPane.current?.isCollapsed(0)) navPane.current?.expand(0);
  }, [isTablet, navPane]);

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.revealItemInList,
      async (id?: string) => {
        if (!useStore.getState().isListPaneVisible) {
          useStore.getState().toggleListPane(true);
          setTimeout(() => {
            AppEventManager.publish(AppEvents.revealItemInList, id);
          }, 500);
        }
      }
    );

    const navEvent = NavigationEvents.subscribe("onNavigate", () => {
      useStore.getState().toggleListPane(true);
    });
    return () => {
      navEvent.unsubscribe();
      event.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isListPaneVisible) {
      if (navPane.current?.hasExpandedSize(1)) navPane.current?.expand(1);
      else navPane.current?.reset(1);
    } else navPane.current?.collapse(1);
  }, [isListPaneVisible, navPane]);

  return (
    <SplitPane
      ref={navPane}
      onChange={(sizes) => {
        useStore.setState({
          isNavPaneCollapsed: sizes[0] <= 70,
          isListPaneVisible: sizes[1] > 5
        });
      }}
      testID="global-split-pane"
      direction="vertical"
      autoSaveId="global-panel-group"
      sx={{ overflow: "hidden" }}
    >
      {isFocusMode ? null : (
        <Pane
          id="nav-pane"
          initialSize={isTablet ? 0 : 250}
          snapSize={150}
          minSize={50}
          maxSize={isTablet ? 0 : 500}
        >
          <ThemeScope scope="navigationMenu">
            <Flex sx={{ flex: 1, opacity: isFocused ? 1 : 0.7 }}>
              <NavigationMenu
                onExpand={() => navPane.current?.expand(0)}
                canExpand={!isTablet}
              />
            </Flex>
          </ThemeScope>
        </Pane>
      )}
      {isFocusMode ? null : (
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
      )}
      <Pane id="editor-pane">
        <ThemeScope scope="editor">
          <HashRouter>
            <EditorPlaceholder />
          </HashRouter>
        </ThemeScope>
      </Pane>
    </SplitPane>
  );
}

function MobileAppContents(props: {
  onSideMenuVisibilityChange: (isOpen: boolean) => void;
  onEditorPaneVisibilityChange: (isActive: boolean) => void;
}) {
  const { onSideMenuVisibilityChange, onEditorPaneVisibilityChange } = props;
  const { index, slideToIndex } = useSlider({
    onChange: (current) => {
      onSideMenuVisibilityChange(current === 0);
      onEditorPaneVisibilityChange(current === 2);
    }
  });

  useEffect(() => {
    const toggleSideMenuEvent = AppEventManager.subscribe(
      AppEvents.toggleSideMenu,
      (state) => slideToIndex(state ? 0 : 1)
    );
    const toggleEditorEvent = AppEventManager.subscribe(
      AppEvents.toggleEditor,
      (state) => slideToIndex(state ? 2 : 1)
    );
    return () => {
      toggleSideMenuEvent.unsubscribe();
      toggleEditorEvent.unsubscribe();
    };
  }, [slideToIndex]);

  return (
    <Flex testID="mobile-contents" sx={{ flex: 1, overflow: "hidden" }}>
      {index === 0 ? (
        <ThemeScope scope="navigationMenu">
          <Flex sx={{ flex: 1 }}>
            <NavigationMenu canExpand={false} />
          </Flex>
        </ThemeScope>
      ) : null}
      {index === 1 ? (
        <ThemeScope scope="list">
          <Flex sx={{ flexDirection: "column", flex: 1, bg: "background" }}>
            <CachedRouter />
          </Flex>
        </ThemeScope>
      ) : null}
      {index === 2 ? (
        <ThemeScope scope="editor">
          <HashRouter>
            <EditorPlaceholder />
          </HashRouter>
        </ThemeScope>
      ) : null}
    </Flex>
  );
}
