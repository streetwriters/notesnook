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
import { SchemeColors } from "../../theme-engine/types.js";
import { alpha } from "@theme-ui/color";

export const createButtonVariant = (
  background: SchemeColors = "transparent",
  color: SchemeColors = "paragraph",
  states?: {
    hover?: ThemeUIStyleObject;
    active?: ThemeUIStyleObject;
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

  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",

  transition: "transform 50ms ease-out",
  ":hover:not(:disabled):not(:active)": {
    bg: background,
    filter: "brightness(90%)",
    ...states?.hover
  },
  ":active:not(:disabled)": {
    bg: background,
    filter: "brightness(85%)",
    transform: "scale(0.98) !important",
    ...states?.hover,
    ...states?.active
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
  "paragraph"
);

const accent = createButtonVariant("accent", "accentForeground", {
  hover: { bg: alpha("accent", 0.9) },
  active: { bg: alpha("accent", 0.8) }
});
const accentSecondary = createButtonVariant("shade", "accent", {
  hover: { bg: alpha("shade", 0.3) }
});

const error = createButtonVariant("accent-error", "accentForeground-error", {
  hover: { bg: alpha("accent-error", 0.9) }
});

const errorSecondary: ThemeUIStyleObject = createButtonVariant(
  "background-error",
  "accent-error"
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
    hover: { bg: "hover" }
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
