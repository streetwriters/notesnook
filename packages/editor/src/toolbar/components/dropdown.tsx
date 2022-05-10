import { useRef, useState } from "react";
import { Button, Flex, Text } from "rebass";
import { Icon } from "./icon";
import { Icons } from "../icons";
import { MenuPresenter, MenuPresenterProps } from "../../components/menu/menu";
import { MenuItem } from "../../components/menu/types";
import { useToolbarContext } from "../hooks/useToolbarContext";

type DropdownProps = {
  selectedItem: string | JSX.Element;
  items: MenuItem[];
  buttonRef?: React.MutableRefObject<HTMLButtonElement | undefined>;
  menuWidth?: number;
};
export function Dropdown(props: DropdownProps) {
  const { items, selectedItem, buttonRef, menuWidth } = props;
  const internalRef = useRef<any>();
  const [isOpen, setIsOpen] = useState(false);
  const { toolbarLocation } = useToolbarContext();

  return (
    <>
      <Button
        ref={(ref) => {
          internalRef.current = ref;
          if (buttonRef) buttonRef.current = ref;
        }}
        sx={{
          p: 1,
          m: 0,
          bg: isOpen ? "hover" : "transparent",
          mr: 1,
          display: "flex",
          alignItems: "center",
          ":hover": { bg: "hover" },
          ":last-of-type": {
            mr: 0,
          },
        }}
        onClick={() => setIsOpen((s) => !s)}
        onMouseDown={(e) => e.preventDefault()}
      >
        {typeof selectedItem === "string" ? (
          <Text sx={{ fontSize: 12, mr: 1, color: "text" }}>
            {selectedItem}
          </Text>
        ) : (
          selectedItem
        )}
        <Icon
          path={
            toolbarLocation === "bottom" ? Icons.chevronUp : Icons.chevronDown
          }
          size={14}
          color={"text"}
        />
      </Button>
      <MenuPresenter
        options={{
          type: "menu",
          position: {
            target: internalRef.current || undefined,
            isTargetAbsolute: true,
            location: toolbarLocation === "bottom" ? "top" : "below",
            yOffset: 5,
          },
        }}
        isOpen={isOpen}
        items={items}
        onClose={() => setIsOpen(false)}
        sx={{ minWidth: menuWidth }}
      />
    </>
  );
}
