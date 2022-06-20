import { PropsWithChildren, useRef, useState } from "react";
import { Flex } from "rebass";
import { Icons } from "../icons";
import { Icon } from "./icon";
import { ToolButton, ToolButtonProps } from "./tool-button";
import { useToolbarLocation } from "../stores/toolbar-store";
import {
  PopupWrapper,
  PopupWrapperProps,
} from "../../components/popup-presenter";
import { PositionOptions } from "../../utils/position";
import { Button } from "../../components/button";

export type SplitButtonProps = ToolButtonProps & { onOpen: () => void };
export function SplitButton(props: PropsWithChildren<SplitButtonProps>) {
  const { children, toggled, onOpen, ...toolButtonProps } = props;

  const ref = useRef<HTMLDivElement>(null);
  const toolbarLocation = useToolbarLocation();

  return (
    <>
      <Flex
        ref={ref}
        sx={{
          borderRadius: "default",
          bg: toggled ? "hover" : "transparent",
          ":hover": { bg: "hover" },
        }}
      >
        <ToolButton {...toolButtonProps} toggled={toggled} />
        <Button
          sx={{
            p: 0,
            m: 0,
            bg: toggled ? "hover" : "transparent",
            ":hover": { bg: "hover" },
            ":last-of-type": {
              mr: 0,
            },
          }}
          onClick={onOpen}
        >
          <Icon
            path={
              toolbarLocation === "bottom" ? Icons.chevronUp : Icons.chevronDown
            }
            color="text"
            size={"small"}
          />
        </Button>
      </Flex>
      {children}
    </>
  );
}
