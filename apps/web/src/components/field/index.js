import React from "react";
import { Flex } from "rebass";
import { Input, Label } from "@rebass/forms";

function Field(props) {
  const {
    id,
    label,
    type,
    sx,
    name,
    required,
    autoFocus,
    autoComplete,
  } = props;
  return (
    <Flex sx={sx} flexDirection="column">
      <Label htmlFor={id} sx={{ fontSize: "title" }}>
        {label}
      </Label>
      {/* <Label htmlFor={id} sx={{ fontSize: "body", color: "gray" }} mb={1}>
        Hello I am secondary
      </Label> */}
      <Input
        autoFocus={autoFocus}
        required={required}
        name={name}
        id={id}
        autoComplete={autoComplete}
        type={type || "text"}
        mt={1}
      />
    </Flex>
  );
}

export default Field;
