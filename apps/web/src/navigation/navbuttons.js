import { Box } from "rebass";
import React from "react";

export function navButton(key, onclick, icon) {
  return createBtn(key, { onclick, icon });
}

function createBtn(key, props = {}) {
  return {
    [key]: {
      ...props
    }
  };
}

//export default navButton;
