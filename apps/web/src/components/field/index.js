import React, { useState } from "react";
import { Flex } from "rebass";
import { Input, Label } from "@rebass/forms";
import * as Icon from "../icons";

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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <Flex sx={sx} flexDirection="column">
      <Label
        htmlFor={id}
        sx={{
          fontSize: "subtitle",
          fontWeight: "bold",
          color: "text",
        }}
      >
        {label}
      </Label>
      {/* <Label htmlFor={id} sx={{ fontSize: "body", color: "gray" }} mb={1}>
        Hello I am secondary
      </Label> */}
      <Flex mt={1} sx={{ position: "relative" }}>
        <Input
          autoFocus={autoFocus}
          required={required}
          name={name}
          id={id}
          autoComplete={autoComplete}
          type={type || "text"}
        />
        {type === "password" && (
          <Flex
            onClick={() => {
              const input = document.getElementById(id);
              input.type = isPasswordVisible ? "password" : "text";
              setIsPasswordVisible((s) => !s);
            }}
            variant="rowCenter"
            sx={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              px: 1,
              borderRadius: "default",
              ":hover": { bg: "border" },
            }}
          >
            {isPasswordVisible ? (
              <Icon.PasswordVisible />
            ) : (
              <Icon.PasswordInvisible />
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

export default Field;
