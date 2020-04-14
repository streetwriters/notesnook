import React from "react";
import Input from "./index";
import Dropper from "../dropper";

function PasswordInput(props) {
  const { confirm } = props;
  return (
    <Dropper {...props}>
      <Input title="Password" type="password" name="password" />
      {confirm && (
        <Input
          title="Confirm Password"
          type="password"
          error="Passwords do not match"
          name="confirm"
          validate={(password, form) =>
            !form.password || form.password === password
          }
        />
      )}
    </Dropper>
  );
}

export default PasswordInput;
