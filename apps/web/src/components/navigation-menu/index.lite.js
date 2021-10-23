import { Flex } from "rebass";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { Button, Text } from "rebass";
import useTablet from "../../utils/use-tablet";
import {
  Note,
  Notebook,
  StarOutline,
  Monographs,
  Tag,
  Trash,
  Settings,
  DarkMode,
  LightMode,
  Sync,
  Login,
} from "../icons";
import useLocation from "../../hooks/use-location";

const routes = [
  { title: "Notes", path: "/", icon: Note },
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

function NavigationMenu() {
  const isLoggedIn = false;
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const [location] = useLocation();

  return (
    <Flex
      id="navigationmenu"
      flexDirection="column"
      justifyContent="space-between"
      flex={1}
      sx={{
        borderRight: "1px solid",
        borderRightColor: "border",
        minWidth: [
          NAVIGATION_MENU_WIDTH,
          NAVIGATION_MENU_TABLET_WIDTH,
          NAVIGATION_MENU_WIDTH,
        ],
        maxWidth: [
          NAVIGATION_MENU_WIDTH,
          NAVIGATION_MENU_TABLET_WIDTH,
          NAVIGATION_MENU_WIDTH,
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
            selected={
              item.path === "/"
                ? location === item.path
                : location.startsWith(item.path)
            }
          />
        ))}
      </Flex>
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
            <NavigationItem title="Sync" icon={Sync} />
          </>
        ) : (
          <NavigationItem title="Login" icon={Login} />
        )}
        {bottomRoutes.map((item) => (
          <NavigationItem
            key={item.path}
            title={item.title}
            icon={item.icon}
            selected={location.startsWith(item.path)}
          />
        ))}
      </Flex>
    </Flex>
  );
}
export default NavigationMenu;

function NavigationItem(props) {
  const { icon: Icon, color, title, isLoading } = props;
  const isTablet = useTablet();

  return (
    <Button
      data-test-id={`navitem-${title.toLowerCase()}`}
      variant="icon"
      bg={props.selected ? "border" : "transparent"}
      p={2}
      mx={2}
      mt={[1, 2, 1]}
      sx={{
        borderRadius: "default",
        position: "relative",
        ":first-of-type": { mt: 2 },
        ":last-of-type": { mb: 2 },
      }}
      label={title}
      title={title}
      onClick={() => {
        props.onClick();
      }}
      display="flex"
      justifyContent={["flex-start", "center", "flex-start"]}
      alignItems="center"
    >
      <Icon
        size={isTablet ? 18 : 15}
        color={color || (props.selected ? "primary" : "icon")}
        rotate={isLoading}
      />

      <Text
        display={["block", "none", "block"]}
        variant="body"
        fontSize="subtitle"
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          fontWeight: props.selected ? "bold" : "normal",
        }}
        ml={1}
      >
        {title}
      </Text>
    </Button>
  );
}
