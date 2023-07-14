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

import { Theme, ThemeUIStyleObject } from "@theme-ui/core";
import { shade, darken, alpha } from "@theme-ui/color";
import { SchemeColors } from "../../theme-engine/types";

const createButtonVariant = (
  background: SchemeColors = "transparent",
  color: SchemeColors = "paragraph",
  states?: {
    hover: SchemeColors | ((theme: Theme) => string);
    active: SchemeColors | ((theme: Theme) => string);
  }
): ThemeUIStyleObject => ({
  bg: background,
  color,

  fontFamily: "body",
  fontWeight: "body",
  fontSize: "body",

  outline: "none",
  borderRadius: "default",
  cursor: "pointer",

  height: "min-content",
  px: 2,
  py: "7.5px",

  ":hover:not(:disabled):not(:active)": {
    bg: states?.hover || shade(background, 0.1)
  },
  ":active": {
    bg: states?.active || shade(background, 0.2)
  },
  ":focus-visible:not(:active)": {
    outline: `2px solid var(--paragraph)`
  },
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed"
  }
});

const primary = createButtonVariant();

const secondary: ThemeUIStyleObject = createButtonVariant(
  "background-secondary",
  "paragraph",
  {
    hover: darken("background-secondary", 0.1),
    active: darken("background-secondary", 0.2)
  }
);

const accent = createButtonVariant("accent", "white");
const accentSecondary = createButtonVariant("shade", "accent", {
  hover: darken("shade", 0.2),
  active: alpha("shade", 0.2)
});

const error = createButtonVariant("accent-error", "white");

const errorSecondary: ThemeUIStyleObject = createButtonVariant(
  "background-error",
  "accent-error",
  {
    hover: darken("background-error", 0.2),
    active: darken("background-error", 0.4)
  }
);

const dialog: ThemeUIStyleObject = {
  variant: "buttons.secondary",
  color: "accent",
  fontWeight: "bold",
  bg: "transparent"
};

const anchor: ThemeUIStyleObject = {
  variant: "buttons.primary",
  color: "accent",
  p: 0,
  m: 0,
  px: 0,
  py: 0,
  textDecoration: "underline",
  ":hover:not(:disabled)": {
    opacity: 0.8
  }
};

const statusItem: ThemeUIStyleObject = {
  variant: "buttons.menuitem",
  py: "small",
  px: "small"
};

const menuItem: ThemeUIStyleObject = {
  ...createButtonVariant("transparent", "paragraph", {
    hover: "hover",
    active: alpha("hover", 0.2)
  }),
  borderRadius: 0
};

export const buttonVariants = {
  primary,
  secondary,

  accent,
  accentSecondary,
  error,
  errorSecondary,

  anchor,
  dialog,
  statusitem: statusItem,
  icon: menuItem,
  menuitem: menuItem
};
