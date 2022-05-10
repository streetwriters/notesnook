import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import React, { PropsWithChildren, useRef, useState } from "react";
import { Button, ButtonProps, Flex } from "rebass";
import { IconNames, Icons } from "../icons";
import { Icon } from "./icon";
import { ToolButton, ToolButtonProps } from "./tool-button";
import { MenuPresenter, MenuPresenterProps } from "../../components/menu/menu";

type SplitButtonProps = ToolButtonProps & {
  menuPresenterProps?: Partial<MenuPresenterProps>;
};
export function SplitButton(props: PropsWithChildren<SplitButtonProps>) {
  const { menuPresenterProps, children, ...toolButtonProps } = props;

  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      <Flex
        ref={ref}
        sx={{
          borderRadius: "default",
          bg: isOpen ? "hover" : "transparent",
          ":hover": { bg: "hover" },
        }}
      >
        <ToolButton {...toolButtonProps} />
        <Button
          sx={{
            p: 0,
            m: 0,
            bg: "transparent",
            ":hover": { bg: "hover" },
            ":last-of-type": {
              mr: 0,
            },
          }}
          onClick={() => setIsOpen((s) => !s)}
        >
          <Icon path={Icons.chevronDown} color="text" size={14} />
        </Button>
      </Flex>
      <MenuPresenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        options={{
          type: "menu",
          position: {
            target: ref.current || undefined,
            isTargetAbsolute: true,
            location: "below",
            yOffset: 5,
          },
        }}
        items={[]}
        {...menuPresenterProps}
      >
        {children}
      </MenuPresenter>
    </>
  );
}
