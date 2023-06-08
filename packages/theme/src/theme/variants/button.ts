/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { ThemeUIStyleObject } from "@theme-ui/core";

const defaultVariant: ThemeUIStyleObject = {
  bg: "transparent",
  fontFamily: "body",
  fontWeight: "body",
  fontSize: "body",
  borderRadius: "default",
  cursor: "pointer",
  // p: 0,
  height: "min-content",
  px: 2,
  py: "7.5px",
  transition: "filter 200ms ease-in, box-shadow 200ms ease-out",
  ":hover:not(:disabled)": {
    filter: "brightness(90%)"
  },
  ":active": {
    filter: "brightness(98%)"
  },
  outline: "none",
  ":focus-visible:not(:active)": {
    filter: "brightness(90%)",
    bg: "bgSecondary"
  },
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed"
  }
};

const primary: ThemeUIStyleObject = {
  variant: "buttons.default",
  color: "static",
  bg: "primary"
};

const error: ThemeUIStyleObject = {
  variant: "buttons.default",
  color: "static",
  bg: "error"
};

const errorSecondary: ThemeUIStyleObject = {
  variant: "buttons.default",
  color: "error",
  //  fontWeight: "bold",
  bg: "errorBg",
  ":hover": {
    opacity: 0.8
  }
  // border: "1px solid",
  // borderColor: "error",
  // ":hover": {
  //   bg: "error",
  //   color: "static"
  // }
};

const dialog: ThemeUIStyleObject = {
  variant: "buttons.primary",
  color: "primary",
  fontWeight: "bold",
  bg: "transparent",
  ":hover": { bg: "bgSecondary" },
  ":focus:not(:active), :focus-within:not(:active), :focus-visible:not(:active)":
    {
      bg: "hover",
      filter: "brightness(90%)"
    },
  ":disabled": {
    opacity: 0.7,
    cursor: "not-allowed"
  }
};

const secondary: ThemeUIStyleObject = {
  variant: "buttons.default",
  color: "text",
  bg: "border"
};

const tertiary: ThemeUIStyleObject = {
  variant: "buttons.default",
  color: "text",
  bg: "transparent",
  border: "2px solid",
  borderColor: "border",
  ":hover": {
    borderColor: "primary"
  }
};

const list: ThemeUIStyleObject = {
  variant: "buttons.tertiary",
  border: "0px solid",
  borderBottom: "1px solid",
  borderBottomColor: "border",
  borderRadius: 0,
  textAlign: "left",
  py: 2,
  px: 0,
  cursor: "pointer",
  ":hover": {
    borderBottomColor: "primary"
  }
};

const anchor: ThemeUIStyleObject = {
  variant: "buttons.default",
  color: "primary",
  p: 0,
  m: 0,
  px: 0,
  py: 0,
  textDecoration: "underline",
  ":hover": {
    color: "dimPrimary"
  }
};

const icon: ThemeUIStyleObject = {
  variant: "buttons.default",
  color: "text",
  borderRadius: "none",
  ":hover": {
    backgroundColor: "hover",
    filter: "brightness(90%)"
  }
};

const tool: ThemeUIStyleObject = {
  variant: "buttons.default",
  color: "text",
  backgroundColor: "bgSecondary",
  borderRadius: "default",
  ":hover": {
    backgroundColor: "hover"
  }
};

const statusItem: ThemeUIStyleObject = {
  variant: "buttons.icon",
  py: 1,
  px: 1
};

const menuItem: ThemeUIStyleObject = {
  variant: "buttons.default",
  // bg: "transparent",
  py: "8px",
  px: 3,
  borderRadius: 0,
  color: "text",
  cursor: "pointer",
  ":hover:not(:disabled),:focus:not(:disabled)": {
    backgroundColor: "hover",
    boxShadow: "none"
  },
  ":active:not(:disabled)": {
    backgroundColor: "border"
  }
};

export const buttonVariants = {
  default: defaultVariant,
  primary,
  secondary,
  tertiary,

  error,
  errorSecondary,

  list,
  anchor,
  tool,
  icon,
  dialog,
  statusitem: statusItem,
  menuitem: menuItem
};
