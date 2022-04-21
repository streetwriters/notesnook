import { useRef, useState } from "react";
import { Button, Flex, Text } from "rebass";
import { Icon } from "./icon";
import { Icons } from "../icons";
import { MenuPresenter } from "../../components/menu/menu";
import { MenuItem } from "../../components/menu/types";

type DropdownProps = {
  selectedItem: string | JSX.Element;
  items: MenuItem[];
  buttonRef?: React.MutableRefObject<HTMLButtonElement | undefined>;
};
export function Dropdown(props: DropdownProps) {
  const { items, selectedItem, buttonRef } = props;
  const internalRef = useRef<any>();
  const [isOpen, setIsOpen] = useState(false);

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
      >
        {typeof selectedItem === "string" ? (
          <Text sx={{ fontSize: 12, mr: 1, color: "text" }}>
            {selectedItem}
          </Text>
        ) : (
          selectedItem
        )}
        <Icon path={Icons.chevronDown} size={16} color={"text"} />
      </Button>
      <MenuPresenter
        options={{
          type: "menu",
          position: {
            target: internalRef.current || undefined,
            isTargetAbsolute: true,
            location: "below",
            yOffset: 5,
          },
        }}
        isOpen={isOpen}
        items={items}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
