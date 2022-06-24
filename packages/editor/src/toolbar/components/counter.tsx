import React from "react";
import { Flex, Text } from "rebass";
import { Button } from "../../components/button";
import { ToolButton } from "./tool-button";

export type CounterProps = {
  title: string;
  onIncrease: () => void;
  onDecrease: () => void;
  onReset: () => void;
  value: string;
};
function _Counter(props: CounterProps) {
  const { title, onDecrease, onIncrease, onReset, value } = props;

  return (
    <Flex
      sx={{
        alignItems: "center",
        mr: 1,
        ":last-of-type": {
          mr: 0,
        },
      }}
    >
      <ToolButton
        toggled={false}
        title={`Decrease ${title}`}
        icon="minus"
        variant={"small"}
        onClick={onDecrease}
      />

      <Button
        sx={{
          bg: "transparent",
        }}
        onClick={onReset}
      >
        <Text
          variant={"body"}
          sx={{ fontSize: "subBody", mx: 1, textAlign: "center" }}
          title={`Reset ${title}`}
        >
          {value}
        </Text>
      </Button>

      <ToolButton
        toggled={false}
        title={`Increase ${title}`}
        icon="plus"
        variant={"small"}
        onClick={onIncrease}
      />
    </Flex>
  );
}

export const Counter = React.memo(_Counter, (prev, next) => {
  return prev.value === next.value;
});
