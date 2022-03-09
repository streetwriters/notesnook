import { useCallback, useEffect } from "react";
import { Box, Flex } from "rebass";
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
  Sync,
  Login,
  Circle,
} from "../icons";
import { AnimatedFlex } from "../animated";
import NavigationItem from "./navigation-item";
import { hardNavigate, navigate } from "../../navigation";
import { db } from "../../common/db";
import useMobile from "../../utils/use-mobile";
import { showRenameColorDialog } from "../../common/dialog-controller";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import useLocation from "../../hooks/use-location";
import { FlexScrollContainer } from "../scroll-container";
import { toTitleCase } from "../../utils/string";

const navigationHistory = new Map();
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
  { title: "Notes", path: "/notes", icon: Note },
  {
    title: "Notebooks",
    path: "/notebooks",
    icon: Notebook,
  },
  {
    title: "Favorites",
    path: "/favorites",
    icon: StarOutline,
  },
  { title: "Tags", path: "/tags", icon: Tag },
  {
    title: "Monographs",
    path: "/monographs",
    icon: Monographs,
  },
  { title: "Trash", path: "/trash", icon: Trash },
];

const bottomRoutes = [
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

const NAVIGATION_MENU_WIDTH = "10em";
const NAVIGATION_MENU_TABLET_WIDTH = "4em";

function NavigationMenu(props) {
  const { toggleNavigationContainer } = props;
  const [location, previousLocation, state] = useLocation();
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const colors = useAppStore((store) => store.colors);
  const pins = useAppStore((store) => store.menuPins);
  const refreshNavItems = useAppStore((store) => store.refreshNavItems);
  const isSyncing = useAppStore((store) => store.syncStatus === "syncing");
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const sync = useAppStore((store) => store.sync);
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const isMobile = useMobile();

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
    <AnimatedFlex
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
      <FlexScrollContainer>
        <Flex flexDirection="column">
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
                _navigate(item.path);
              }}
            />
          ))}
          {colors.map((color) => (
            <NavigationItem
              key={color.id}
              title={db.colors.alias(color.id)}
              icon={Circle}
              selected={location === `/colors/${color.id}`}
              color={color.title.toLowerCase()}
              onClick={() => {
                _navigate(`/colors/${color.id}`);
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
          <Box
            width="85%"
            height="0.8px"
            bg="border"
            alignSelf="center"
            my={1}
          />
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
                      refreshNavItems();
                    },
                  },
                ],
                extraData: { pin },
              }}
              icon={
                pin.type === "notebook"
                  ? Notebook2
                  : pin.type === "tag"
                  ? Tag2
                  : Topic
              }
              isShortcut
              selected={shouldSelectNavItem(location, pin)}
              onClick={() => {
                if (pin.type === "notebook") {
                  _navigate(`/notebooks/${pin.id}`);
                } else if (pin.type === "topic") {
                  _navigate(`/notebooks/${pin.notebookId}/${pin.id}`);
                } else if (pin.type === "tag") {
                  _navigate(`/tags/${pin.id}`);
                }
              }}
            />
          ))}
        </Flex>
      </FlexScrollContainer>
      <Flex flexDirection="column">
        {theme === "light" ? (
          <NavigationItem
            title="Dark mode"
            icon={DarkMode}
            onClick={toggleNightMode}
          />
        ) : (
          <NavigationItem
            title="Light mode"
            icon={LightMode}
            onClick={toggleNightMode}
          />
        )}
        {isLoggedIn ? (
          <>
            <NavigationItem
              title="Sync"
              isLoading={isSyncing}
              icon={Sync}
              onClick={sync}
            />
          </>
        ) : (
          <NavigationItem
            title="Login"
            icon={Login}
            onClick={() => hardNavigate("/login")}
          />
        )}
        {bottomRoutes.map((item) => (
          <NavigationItem
            key={item.path}
            title={item.title}
            icon={item.icon}
            onClick={() => {
              _navigate(item.path);
            }}
            selected={location.startsWith(item.path)}
          />
        ))}
      </Flex>
    </AnimatedFlex>
  );
}
export default NavigationMenu;

function findNestedRoute(location) {
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
