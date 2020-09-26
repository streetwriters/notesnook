import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Flex } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import Animated from "../animated";
import NavigationItem from "./navigation-item";
import { navigate } from "hookrouter";
import { toTitleCase } from "../../utils/string";
import { COLORS } from "../../common";
import { showLogInDialog } from "../dialogs/logindialog";
import { usePath } from "hookrouter";
import useMobile from "../../utils/use-mobile";

const routes = [
  { title: "Home", path: "/", icon: Icon.Home },
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
  { title: "Trash", path: "/trash", icon: Icon.Trash },
  { title: "Tags", path: "/tags", icon: Icon.Tag },
];

const bottomRoutes = [
  {
    title: "Settings",
    path: "/settings",
    icon: Icon.Settings,
  },
];

function NavigationMenu(props) {
  const { toggleNavigationContainer } = props;
  const path = usePath(false);
  const [selectedRoute, setSelectedRoute] = useState(path);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const colors = useAppStore((store) => store.colors);
  const isSideMenuOpen = useAppStore((store) => store.isSideMenuOpen);
  const toggleSideMenu = useAppStore((store) => store.toggleSideMenu);
  const isSyncing = useUserStore((store) => store.isSyncing);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const logout = useUserStore((store) => store.logout);
  const sync = useUserStore((store) => store.sync);
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const isMobile = useMobile();

  useEffect(() => {
    setSelectedRoute(path);
  }, [path]);

  useEffect(() => {
    if (!isMobile) return;
    const app = document.getElementById("app");
    let startX = 0;
    app.ontouchstart = function (event) {
      startX = event.touches[0].pageX;
    };

    app.ontouchmove = function (event) {
      let currentX = event.touches[0].pageX;
      if (currentX - startX > 50) {
        toggleSideMenu(true);
        startX = currentX;
      } else if (currentX - startX < -50) {
        toggleSideMenu(false);
        startX = currentX;
      }
    };
  }, [toggleSideMenu, isMobile]);

  return (
    <Animated.Flex
      id="navigationmenu"
      flexDirection="column"
      justifyContent="space-between"
      initial={{
        opacity: 1,
        x: isMobile ? -500 : 0,
      }}
      animate={{
        opacity: isFocusMode ? 0 : 1,
        visibility: isFocusMode ? "hidden" : "visible",
        x: isMobile ? (isSideMenuOpen ? 0 : -500) : 0,
        zIndex: isSideMenuOpen ? 999 : 1,
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      sx={{
        borderRight: "1px solid",
        borderRightColor: "border",
        minWidth: ["85%", 50, 50],
        maxWidth: ["85%", 50, 50],
        height: ["100%", "auto", "auto"],
        position: ["absolute", "relative", "relative"],
      }}
      bg={"background"}
      px={0}
    >
      {isSideMenuOpen &&
        ReactDOM.createPortal(
          <Flex
            sx={{
              position: "absolute",
              height: "100%",
              width: "100%",
              zIndex: 998,
            }}
            bg="overlay"
            onClick={() => toggleSideMenu()}
          />,
          document.getElementById("app")
        )}
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
            selected={
              item.path === "/"
                ? selectedRoute === item.path
                : selectedRoute.startsWith(item.path)
            }
            onClick={() => {
              setSelectedRoute(item.path);
              if (selectedRoute === item.path)
                return toggleNavigationContainer();
              toggleNavigationContainer(true);
              navigate(item.path);
            }}
          />
        ))}
        {colors.map((color) => (
          <NavigationItem
            key={color.title}
            title={toTitleCase(color.title)}
            icon={Icon.Circle}
            color={COLORS[color.title]}
            onClick={() => {
              navigate(`/colors/${color.title}`);
            }}
          />
        ))}
      </Flex>
      <Flex flexDirection="column">
        {theme === "light" ? (
          <NavigationItem
            title="Enable dark mode"
            icon={Icon.DarkMode}
            onClick={toggleNightMode}
          />
        ) : (
          <NavigationItem
            title="Enable light mode"
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
            <NavigationItem
              title="Logout"
              icon={Icon.Logout}
              onClick={logout}
            />
          </>
        ) : (
          <NavigationItem
            title="Login"
            icon={Icon.Login}
            onClick={showLogInDialog}
          />
        )}
        {bottomRoutes.map((item) => (
          <NavigationItem
            key={item.path}
            title={item.title}
            icon={item.icon}
            onClick={() => {
              navigate(item.path);
              setSelectedRoute(item.path);
            }}
            selected={selectedRoute.startsWith(item.path)}
          />
        ))}
      </Flex>
    </Animated.Flex>
  );
}
export default NavigationMenu;
