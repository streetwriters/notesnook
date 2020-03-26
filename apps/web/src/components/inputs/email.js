import React from "react";
import Input from "./index";
import { isValidEmail } from "../../utils/validation";

function EmailInput() {
  return (
    <Input
      title="Email"
      name="email"
      type="email"
      error="Email is not valid."
      validate={isValidEmail}
    />
  );
}
export default EmailInput;
