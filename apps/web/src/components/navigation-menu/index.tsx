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

import { useCallback, useEffect } from "react";
import { Box, Button, Flex } from "@theme-ui/components";
import {
  Note,
  Notebook,
  StarOutline,
  Monographs,
  Tag,
  Trash,
  Settings,
  Notebook2,
  Tag2,
  Topic,
  DarkMode,
  LightMode,
  Login,
  Circle,
  Icon,
  Reminders
} from "../icons";
import { AnimatedFlex } from "../animated";
import NavigationItem from "./navigation-item";
import { hardNavigate, hashNavigate, navigate } from "../../navigation";
import { db } from "../../common/db";
import useMobile from "../../hooks/use-mobile";
import { showRenameColorDialog } from "../../common/dialog-controller";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import useLocation from "../../hooks/use-location";
import { FlexScrollContainer } from "../scroll-container";
import { ScopedThemeProvider } from "../theme-provider";

type Route = {
  title: string;
  path: string;
  icon: Icon;
  tag?: string;
};

const navigationHistory = new Map();
function shouldSelectNavItem(
  route: string,
  pin: { type: string; id: string; notebookId: string }
) {
  if (pin.type === "notebook") {
    return route === `/notebooks/${pin.id}`;
  } else if (pin.type === "topic") {
    return route === `/notebooks/${pin.notebookId}/${pin.id}`;
  } else if (pin.type === "tag") {
    return route === `/tags/${pin.id}`;
  }
  return false;
}

const routes: Route[] = [
  { title: "Notes", path: "/notes", icon: Note },
  {
    title: "Notebooks",
    path: "/notebooks",
    icon: Notebook
  },
  {
    title: "Favorites",
    path: "/favorites",
    icon: StarOutline
  },
  { title: "Tags", path: "/tags", icon: Tag },
  {
    title: "Monographs",
    path: "/monographs",
    icon: Monographs
  },
  {
    title: "Reminders",
    path: "/reminders",
    icon: Reminders,
    tag: "Beta"
  },
  { title: "Trash", path: "/trash", icon: Trash }
];

const settings: Route = {
  title: "Settings",
  path: "/settings",
  icon: Settings
};

type NavigationMenuProps = {
  toggleNavigationContainer: (toggleState?: boolean) => void;
  isTablet: boolean;
};

function NavigationMenu(props: NavigationMenuProps) {
  const { toggleNavigationContainer, isTablet } = props;
  const [location, previousLocation, state] = useLocation();
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const colors = useAppStore((store) => store.colors);
  const shortcuts = useAppStore((store) => store.shortcuts);
  const refreshNavItems = useAppStore((store) => store.refreshNavItems);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const isMobile = useMobile();
  const theme = useThemeStore((store) => store.colorScheme);
  const toggleNightMode = useThemeStore((store) => store.toggleColorScheme);
  const setFollowSystemTheme = useThemeStore(
    (store) => store.setFollowSystemTheme
  );

  const _navigate = useCallback(
    (path) => {
      toggleNavigationContainer(true);
      const nestedRoute = findNestedRoute(path);
      navigate(!nestedRoute || nestedRoute === location ? path : nestedRoute);
    },
    [location, toggleNavigationContainer]
  );

  useEffect(() => {
    if (state === "forward" || state === "neutral")
      navigationHistory.set(location, true);
    else navigationHistory.delete(previousLocation);
  }, [location, previousLocation, state]);

  return (
    <ScopedThemeProvider
      scope="navigationMenu"
      sx={{
        display: "flex",
        zIndex: 1,
        position: "relative",
        flex: 1,
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bg: "background",
        borderRight: "1px solid var(--separator)"
      }}
    >
      <AnimatedFlex
        id="navigation-menu"
        data-test-id="navigation-menu"
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: isFocusMode ? 0 : 1,
          visibility: isFocusMode ? "collapse" : "visible"
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        sx={{
          flex: 1,
          overflow: "hidden",
          flexDirection: "column",
          justifyContent: "space-between"
        }}
        px={0}
      >
        <FlexScrollContainer
          style={{
            flexDirection: "column",
            display: "flex"
          }}
          suppressScrollX={true}
        >
          <Flex sx={{ flexDirection: "column" }}>
            {routes.map((item) => (
              <NavigationItem
                isTablet={isTablet}
                key={item.path}
                title={item.title}
                icon={item.icon}
                tag={item.tag}
                selected={
                  item.path === "/"
                    ? location === item.path
                    : location.startsWith(item.path)
                }
                onClick={() => {
                  if (!isMobile && location === item.path)
                    return toggleNavigationContainer();
                  _navigate(item.path);
                }}
              />
            ))}
            {colors.map((color, index) => (
              <NavigationItem
                animate={!IS_DESKTOP_APP}
                index={index}
                isTablet={isTablet}
                key={color.id}
                title={color.title}
                icon={Circle}
                selected={location === `/colors/${color.id}`}
                color={color.title.toLowerCase()}
                onClick={() => {
                  _navigate(`/colors/${color.id}`);
                }}
                menuItems={[
                  {
                    type: "button",
                    key: "rename",
                    title: "Rename color",
                    onClick: async () => {
                      await showRenameColorDialog(color.id);
                    }
                  }
                ]}
              />
            ))}
            <Box
              bg="separator"
              my={1}
              sx={{ width: "85%", height: "0.8px", alignSelf: "center" }}
            />
            {shortcuts.map((item, index) => (
              <NavigationItem
                animate={!IS_DESKTOP_APP}
                index={colors.length - 1 + index}
                isTablet={isTablet}
                key={item.id}
                title={item.title}
                menuItems={[
                  {
                    type: "button",
                    key: "removeshortcut",
                    title: "Remove shortcut",
                    onClick: async () => {
                      await db.shortcuts.remove(item.id);
                      refreshNavItems();
                    }
                  }
                ]}
                icon={
                  item.type === "notebook"
                    ? Notebook2
                    : item.type === "tag"
                    ? Tag2
                    : Topic
                }
                isShortcut
                selected={shouldSelectNavItem(location, item)}
                onClick={() => {
                  if (item.type === "notebook") {
                    _navigate(`/notebooks/${item.id}`);
                  } else if (item.type === "topic") {
                    _navigate(`/notebooks/${item.notebookId}/${item.id}`);
                  } else if (item.type === "tag") {
                    _navigate(`/tags/${item.id}`);
                  }
                }}
              />
            ))}
          </Flex>
        </FlexScrollContainer>

        <Flex sx={{ flexDirection: "column" }}>
          {isLoggedIn === false && (
            <NavigationItem
              isTablet={isTablet}
              title="Login"
              icon={Login}
              onClick={() => hardNavigate("/login")}
            />
          )}
          {isTablet && (
            <NavigationItem
              isTablet={isTablet}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              icon={theme === "dark" ? LightMode : DarkMode}
              onClick={() => {
                setFollowSystemTheme(false);
                toggleNightMode();
              }}
            />
          )}
          <NavigationItem
            isTablet={isTablet}
            key={settings.path}
            title={settings.title}
            icon={settings.icon}
            onClick={() => {
              if (!isMobile && location === settings.path)
                return toggleNavigationContainer();
              hashNavigate("/settings");
            }}
            selected={location.startsWith(settings.path)}
          >
            {isTablet ? null : (
              <Button
                variant={"icon"}
                title="Toggle dark/light mode"
                sx={{ borderLeft: "1px solid var(--separator)" }}
                onClick={() => {
                  setFollowSystemTheme(false);
                  toggleNightMode();
                }}
              >
                {theme === "dark" ? (
                  <LightMode size={16} />
                ) : (
                  <DarkMode size={16} />
                )}
              </Button>
            )}
          </NavigationItem>
        </Flex>
      </AnimatedFlex>
    </ScopedThemeProvider>
  );
}
export default NavigationMenu;

function findNestedRoute(location: string) {
  let level = location.split("/").length;
  let nestedRoute = undefined;
  const history = Array.from(navigationHistory.keys());
  for (let i = history.length - 1; i >= 0; --i) {
    const route = history[i];
    if (!navigationHistory.get(route)) continue;

    const routeLevel = route.split("/").length;
    if (route.startsWith(location) && routeLevel > level) {
      level = routeLevel;
      nestedRoute = route;
    }
  }
  return nestedRoute;
}
