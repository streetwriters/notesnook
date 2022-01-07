import { Button, Text } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";
import { useMenuTrigger } from "../../hooks/use-menu";
import useMobile from "../../utils/use-mobile";
import useTablet from "../../utils/use-tablet";
import * as Icons from "../icons";

function NavigationItem(props) {
  const { icon: Icon, color, title, isLoading, isShortcut, isNew } = props;
  const toggleSideMenu = useAppStore((store) => store.toggleSideMenu);
  const { openMenu } = useMenuTrigger();
  const isMobile = useMobile();
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
      justifyContent={["flex-start", "center", "flex-start"]}
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
export default NavigationItem;
