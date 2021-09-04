import React from "react";
import { Box, Flex } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import Animated from "../animated";
import NavigationItem from "./navigation-item";
import { navigate } from "../../navigation";
import { db } from "../../common/db";
import useMobile from "../../utils/use-mobile";
import { useLocation } from "wouter";
import { showRenameColorDialog } from "../../common/dialog-controller";

function shouldSelectNavItem(route, pin) {
  if (pin.type === "notebook") {
    return route === `/notebooks/${pin.id}`;
  } else if (pin.type === "topic") {
    return route === `/notebooks/${pin.notebookId}/${pin.id}`;
  } else if (pin.type === "tag") {
    return route === `/tags/${pin.id}`;
  }
}

const routes = [
  { title: "Notes", path: "/", icon: Icon.Note },
  {
    title: "Notebooks",
    path: "/notebooks",
    icon: Icon.Notebook,
  },
  {
    title: "Favorites",
    path: "/favorites",
    icon: Icon.StarOutline,
  },
  { title: "Tags", path: "/tags", icon: Icon.Tag },
  {
    title: "Monographs",
    path: "/monographs",
    icon: Icon.Monographs,
  },
  { title: "Trash", path: "/trash", icon: Icon.Trash },
];

const bottomRoutes = [
  {
    title: "Settings",
    path: "/settings",
    icon: Icon.Settings,
  },
];

const NAVIGATION_MENU_WIDTH = "10em";
const NAVIGATION_MENU_TABLET_WIDTH = "4em";

function NavigationMenu(props) {
  const { toggleNavigationContainer } = props;
  const [location] = useLocation();
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const colors = useAppStore((store) => store.colors);
  const pins = useAppStore((store) => store.menuPins);
  const refreshMenuPins = useAppStore((store) => store.refreshMenuPins);
  const isSyncing = useAppStore((store) => store.isSyncing);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const sync = useAppStore((store) => store.sync);
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const isMobile = useMobile();

  return (
    <Animated.Flex
      id="navigationmenu"
      flexDirection="column"
      justifyContent="space-between"
      flex={1}
      initial={{
        opacity: 1,
      }}
      animate={{
        opacity: isFocusMode ? 0 : 1,
        visibility: isFocusMode ? "collapse" : "visible",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      sx={{
        borderRight: "1px solid",
        borderRightColor: "border",
        minWidth: [
          NAVIGATION_MENU_WIDTH,
          isFocusMode ? 0 : NAVIGATION_MENU_TABLET_WIDTH,
          isFocusMode ? 0 : NAVIGATION_MENU_WIDTH,
        ],
        maxWidth: [
          NAVIGATION_MENU_WIDTH,
          isFocusMode ? 0 : NAVIGATION_MENU_TABLET_WIDTH,
          isFocusMode ? 0 : NAVIGATION_MENU_WIDTH,
        ],
        zIndex: 1,
        height: "auto",
        position: "relative",
      }}
      bg={"bgSecondary"}
      px={0}
    >
      <Flex
        flexDirection="column"
        sx={{
          overflow: "scroll",
          scrollbarWidth: "none",
          "::-webkit-scrollbar": { width: 0, height: 0 },
          msOverflowStyle: "none",
        }}
      >
        {routes.map((item) => (
          <NavigationItem
            key={item.path}
            title={item.title}
            icon={item.icon}
            isNew={item.isNew}
            selected={
              item.path === "/"
                ? location === item.path
                : location.startsWith(item.path)
            }
            onClick={() => {
              if (!isMobile && location === item.path)
                return toggleNavigationContainer();
              toggleNavigationContainer(true);
              navigate(item.path);
            }}
          />
        ))}
        {colors.map((color) => (
          <NavigationItem
            key={color.id}
            title={db.colors.alias(color.id)}
            icon={Icon.Circle}
            selected={location === `/colors/${color.id}`}
            color={color.title.toLowerCase()}
            onClick={() => {
              navigate(`/colors/${color.id}`);
            }}
            menu={{
              items: [
                {
                  key: "rename",
                  title: () => "Rename color",
                  onClick: async ({ color }) => {
                    await showRenameColorDialog(color.id);
                  },
                },
              ],
              extraData: { color },
            }}
          />
        ))}
        <Box width="85%" height="0.8px" bg="border" alignSelf="center" my={1} />
        {pins.map((pin) => (
          <NavigationItem
            key={pin.id}
            title={pin.type === "tag" ? db.tags.alias(pin.id) : pin.title}
            menu={{
              items: [
                {
                  key: "removeshortcut",
                  title: () => "Remove shortcut",
                  onClick: async ({ pin }) => {
                    await db.settings.unpin(pin.id);
                    refreshMenuPins();
                  },
                },
              ],
              extraData: { pin },
            }}
            icon={
              pin.type === "notebook"
                ? Icon.Notebook2
                : pin.type === "tag"
                ? Icon.Tag2
                : Icon.Topic
            }
            isShortcut
            selected={shouldSelectNavItem(location, pin)}
            onClick={() => {
              if (pin.type === "notebook") {
                navigate(`/notebooks/${pin.id}`);
              } else if (pin.type === "topic") {
                navigate(`/notebooks/${pin.notebookId}/${pin.id}`);
              } else if (pin.type === "tag") {
                navigate(`/tags/${pin.id}`);
              }
            }}
          />
        ))}
      </Flex>
      <Flex flexDirection="column">
        {theme === "light" ? (
          <NavigationItem
            title="Dark mode"
            icon={Icon.DarkMode}
            onClick={toggleNightMode}
          />
        ) : (
          <NavigationItem
            title="Light mode"
            icon={Icon.LightMode}
            onClick={toggleNightMode}
          />
        )}
        {isLoggedIn ? (
          <>
            <NavigationItem
              title="Sync"
              isLoading={isSyncing}
              icon={Icon.Sync}
              onClick={sync}
            />
          </>
        ) : (
          <NavigationItem
            title="Login"
            icon={Icon.Login}
            onClick={() => navigate("/login")}
          />
        )}
        {bottomRoutes.map((item) => (
          <NavigationItem
            key={item.path}
            title={item.title}
            icon={item.icon}
            onClick={() => {
              navigate(item.path);
            }}
            selected={location.startsWith(item.path)}
          />
        ))}
      </Flex>
    </Animated.Flex>
  );
}
export default NavigationMenu;
