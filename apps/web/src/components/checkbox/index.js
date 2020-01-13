import React, { useState, useEffect } from "react";
import { Flex, Text } from "rebass";
import { Switch } from "@rebass/forms";
import * as Icon from "react-feather";

const CheckBox = props => {
  const [checked, setChecked] = useState(props.checked || false);
  useEffect(() => {
    setChecked(props.checked);
  }, [props.checked]);
  return (
    <Flex
      onClick={() => {
        setChecked(!checked);
        if (props.onChecked) {
          props.onChecked(!checked);
        }
      }}
      width="full"
      alignItems="center"
      justifyContent="space-between"
      sx={{ cursor: "pointer", marginBottom: 2 }}
    >
      <Flex fontSize="body" sx={{ cursor: "pointer" }} alignItems="center">
        <props.icon size={18} />
        <Text sx={{ marginLeft: 1 }}>{props.label}</Text>
      </Flex>

      <Switch checked={checked} />
    </Flex>
  );
};

export default CheckBox;
