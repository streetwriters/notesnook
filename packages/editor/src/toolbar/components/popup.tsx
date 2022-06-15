import { Button, ButtonProps, Flex, Text } from "rebass";
import { Icon } from "./icon";
import { IconNames, Icons } from "../icons";
import { PropsWithChildren } from "react";
import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import { DesktopOnly, MobileOnly } from "../../components/responsive";

export type PopupProps = {
  title?: string;
  onClose: () => void;
};

export function Popup(props: PropsWithChildren<PopupProps>) {
  const { title, onClose, children } = props;

  return (
    <>
      <DesktopOnly>
        <Flex
          sx={{
            overflow: "hidden",
            bg: "background",
            flexDirection: "column",
            borderRadius: "default",
            // border: "1px solid var(--border)",
            boxShadow: "menu",
            minWidth: 200,
          }}
        >
          <Flex
            className="movable"
            sx={{
              bg: "bgSecondary",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1,
              mb: 1,
            }}
          >
            <Text variant={"body"}>{title}</Text>
            <Button
              variant={"tool"}
              sx={{ p: 0, bg: "transparent" }}
              onClick={onClose}
            >
              <Icon path={Icons.close} size={16} />
            </Button>
          </Flex>
          {children}
        </Flex>
      </DesktopOnly>
      <MobileOnly>{children}</MobileOnly>
    </>
  );
}
