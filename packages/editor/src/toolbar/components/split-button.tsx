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
import React from "react";

export type SplitButtonProps = ToolButtonProps & { onOpen: () => void };
function _SplitButton(props: PropsWithChildren<SplitButtonProps>) {
  const { children, toggled, onOpen, sx, ...toolButtonProps } = props;

  const ref = useRef<HTMLDivElement>(null);
  const toolbarLocation = useToolbarLocation();

  return (
    <>
      <Flex
        ref={ref}
        sx={{
          borderRadius: "default",
        }}
      >
        <ToolButton
          {...toolButtonProps}
          sx={{ mr: 0, ":hover": { bg: "hover" }, ...sx }}
          toggled={false}
        />
        <Button
          sx={{
            flexShrink: 0,
            p: 0,
            m: 0,
            px: "3px",
            bg: "bgSecondary",
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
            sx={{ flexShrink: 0 }}
          />
        </Button>
      </Flex>
      {children}
    </>
  );
}
export const SplitButton = React.memo(_SplitButton, (prev, next) => {
  return (
    prev.toggled === next.toggled &&
    JSON.stringify(prev.sx) === JSON.stringify(next.sx)
  );
});
