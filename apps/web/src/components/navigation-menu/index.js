import React from "react";
import ReactDOM from "react-dom";
import { Flex } from "rebass";
import RootNavigator, {
  bottomRoutes,
  routes,
} from "../../navigation/navigators/rootnavigator";
import { usePersistentState } from "../../utils/hooks";
import { useStore } from "../../stores/app-store";
import { COLORS } from "../../common";
import { toTitleCase } from "../../utils/string";
import * as Icon from "../icons";
import { useStore as useAppStore } from "../../stores/app-store";
import Animated from "../animated";
import NavItem from "../navitem";
import { objectMap } from "../../utils/object";
import { isMobile } from "../../utils/dimensions";

function NavigationMenu(props) {
  const { toggleNavigationContainer } = props;
  const [selectedRoute, setSelectedRoute] = usePersistentState("route", "home");
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const colors = useStore((store) => store.colors);
  const isSideMenuOpen = useStore((store) => store.isSideMenuOpen);
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);

  return (
    <Animated.Flex
      flexDirection="column"
      justifyContent="space-between"
      initial={{ opacity: 1, x: isMobile() ? -500 : 0 }}
      animate={{
        opacity: isFocusMode ? 0 : 1,
        visibility: isFocusMode ? "hidden" : "visible",
        x: isMobile() ? (isSideMenuOpen ? 0 : -500) : 0,
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
        {objectMap(routes, (_, item) => (
          <NavItem
            key={item.key}
            item={item}
            selected={selectedRoute === item.key}
            onSelected={() => {
              if (selectedRoute === item.key) toggleNavigationContainer();
              else if (RootNavigator.navigate(item.key))
                setSelectedRoute(item.key);
            }}
          />
        ))}
        {colors.map((color) => {
          return (
            <NavItem
              onSelected={async () => {
                setSelectedRoute(undefined);
                RootNavigator.navigate(
                  "color",
                  {
                    title: toTitleCase(color.title),
                    context: {
                      type: "color",
                      value: color.title,
                    },
                  },
                  true
                );
              }}
              key={color.title}
              item={{
                color: COLORS[color.title],
                title: toTitleCase(color.title),
                icon: Icon.Circle,
                count: color.noteIds.length,
              }}
            />
          );
        })}
      </Flex>
      <Flex flexDirection="column">
        {Object.values(bottomRoutes).map((item) => (
          <NavItem
            onSelected={async () => {
              const shouldSelect = item.onClick
                ? await item.onClick()
                : item.component && RootNavigator.navigate(item.key);
              if (shouldSelect) setSelectedRoute(item.key);
            }}
            key={item.key}
            item={item}
            selected={selectedRoute === item.key}
          />
        ))}
      </Flex>
    </Animated.Flex>
  );
}
export default NavigationMenu;
