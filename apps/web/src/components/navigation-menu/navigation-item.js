import { Button, Text } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";
import { useMenuTrigger } from "../../hooks/use-menu";
import useMobile from "../../utils/use-mobile";
import * as Icons from "../icons";

function NavigationItem(props) {
  const {
    icon: Icon,
    color,
    title,
    isLoading,
    isShortcut,
    isNew,
    children,
    isTablet,
  } = props;
  const toggleSideMenu = useAppStore((store) => store.toggleSideMenu);
  const { openMenu } = useMenuTrigger();
  const isMobile = useMobile();

  return (
    <Button
      data-test-id={`navitem-${title.toLowerCase()}`}
      bg={props.selected ? "bgSecondaryHover" : "transparent"}
      px={2}
      py={"9px"}
      mx={1}
      mt={isTablet ? 1 : "3px"}
      sx={{
        borderRadius: "default",
        position: "relative",
        ":first-of-type": { mt: 1 },
        ":last-of-type": { mb: 1 },
        ":hover:not(:disabled)": {
          bg: "bgSecondaryHover",
          filter: "brightness(100%)",
        },
      }}
      label={title}
      title={title}
      onContextMenu={(e) => {
        if (!props.menu) return;
        e.preventDefault();
        openMenu(props.menu.items, props.menu.extraData, false);
      }}
      onClick={() => {
        if (isMobile) toggleSideMenu(false);
        props.onClick();
      }}
      display="flex"
      justifyContent={isTablet ? "center" : "flex-start"}
      alignItems="center"
    >
      <Icon
        size={isTablet ? 18 : 15}
        color={color || (props.selected ? "primary" : "icon")}
        rotate={isLoading}
      />
      {isNew && (
        <Icons.Circle
          size={6}
          sx={{ position: "absolute", bottom: "8px", left: "23px" }}
          color={"primary"}
        />
      )}
      {isShortcut && (
        <Icons.Shortcut
          size={8}
          sx={{ position: "absolute", bottom: "8px", left: "6px" }}
          color={color || "icon"}
        />
      )}

      <Text
        display={isTablet ? "none" : "block"}
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
      {children}
    </Button>
  );
}
export default NavigationItem;
