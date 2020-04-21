import React, { useState } from "react";
import { Input as RebassInput } from "@rebass/forms";
import { Box, Text } from "rebass";
import { toTitleCase } from "../../utils/string";

function Input(props) {
  const { required = true, validate, variant = "input" } = props;
  const { name, form, title } = props;
  const [themeVariant, setThemeVariant] = useState(variant);
  const [error, setError] = useState(props.error);
  return (
    <Box>
      <RebassInput
        {...props}
        variant={themeVariant}
        placeholder={title}
        onChange={event => {
          const { value } = event.target;
          const isValid = !validate || validate(value, form);
          if ((!value.trim() && required) || !isValid) {
            setThemeVariant("error");
            if (form) form.error = true;
            const error =
              !isValid || !name
                ? props.error
                : `${toTitleCase(name)} is required.`;
            setError(error);
          } else {
            setThemeVariant(variant);
            if (form) {
              form[name] = value;
              form.error = false;
            }
          }
        }}
      />
      {themeVariant === "error" && <Text variant="error">{error}</Text>}
    </Box>
  );
}

export default Input;
