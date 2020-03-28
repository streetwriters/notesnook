import React, { useEffect } from "react";
import { Box } from "rebass";
import RootNavigator, {
  bottomRoutes,
  routes
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

function NavigationMenu(props) {
  const { toggleNavigationContainer } = props;
  const [selectedRoute, setSelectedRoute] = usePersistentState("route", "home");
  const isFocusModeEnabled = useAppStore(store => store.isFocusModeEnabled);
  const colors = useStore(store => store.colors);
  const isSideMenuOpen = useStore(store => store.isSideMenuOpen);

  useEffect(() => {
    RootNavigator.navigate(selectedRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.Flex
      flexDirection="column"
      justifyContent="space-between"
      initial={{ opacity: 1 }}
      animate={{
        opacity: isFocusModeEnabled ? 0 : 1,
        visibility: isFocusModeEnabled ? "hidden" : "visible"
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      sx={{
        borderRight: "1px solid",
        borderRightColor: "primary",
        minWidth: ["85%", 50, 50],
        maxWidth: ["85%", 50, 50],
        display: [isSideMenuOpen ? "flex" : "none", "flex", "flex"],
        position: ["absolute", "relative", "relative"]
      }}
      bg={"background"}
      px={0}
    >
      <Box
        sx={{
          overflow: "scroll",
          scrollbarWidth: "none",
          "::-webkit-scrollbar": { width: 0, height: 0 },
          msOverflowStyle: "none"
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
        {colors.map(color => {
          return (
            <NavItem
              onSelected={async () => {
                setSelectedRoute(undefined);
                RootNavigator.navigate("color", {
                  title: toTitleCase(color.title),
                  context: { type: "color", colors: [color.title] }
                });
              }}
              key={color.title}
              item={{
                color: COLORS[color.title],
                title: toTitleCase(color.title),
                icon: Icon.Circle,
                count: color.noteIds.length
              }}
            />
          );
        })}
      </Box>
      <Box>
        {Object.values(bottomRoutes).map(item => (
          <NavItem
            onSelected={async () => {
              const shouldSelect =
                (item.onClick && (await item.onClick())) ||
                (item.component && RootNavigator.navigate(item.key));
              if (shouldSelect) setSelectedRoute(item.key);
            }}
            key={item.key}
            item={item}
            selected={selectedRoute === item.key}
          />
        ))}
      </Box>
    </Animated.Flex>
  );
}
export default NavigationMenu;
