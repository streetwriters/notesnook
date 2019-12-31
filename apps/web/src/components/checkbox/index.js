import React, { useState } from "react";
import { Flex, Text } from "rebass";
import * as Icon from "react-feather";

const CheckBox = props => {
  const [checked, setChecked] = useState(props.checked);
  return (
    <Flex
      onClick={() => {
        setChecked(!checked);
        if (props.onCheckChanged) {
          props.onCheckChanged(checked);
        }
      }}
      className="unselectable"
      width="full"
      alignItems="center"
      justifyContent="space-between"
      sx={{ cursor: "pointer", marginBottom: 2 }}
    >
      <Flex
        className="unselectable"
        fontSize="body"
        sx={{ cursor: "pointer" }}
        alignItems="center"
      >
        <props.icon size={18} />
        <Text sx={{ marginLeft: 1 }}>{props.label}</Text>
      </Flex>
      <Text color={checked ? "primary" : "foreground"}>
        <Icon.CheckCircle
          size={18}
          className="unselectable"
          style={{ cursor: "pointer" }}
        />
      </Text>
    </Flex>
  );
};

export default CheckBox;
