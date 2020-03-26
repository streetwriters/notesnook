import React from "react";
import Input from "./index";

function PasswordInput(props) {
  const { confirm } = props;
  return (
    <>
      <Input title="Password" type="password" name="password" />
      {confirm && (
        <Input
          title="Confirm Password"
          type="password"
          error="Passwords do not match"
          validate={(password, form) => form.password === password}
        />
      )}
    </>
  );
}
export default PasswordInput;
