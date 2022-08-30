/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { SxStyleProp } from "@streetwriters/rebass";

const defaultVariant: SxStyleProp = {
  borderRadius: "default",
  border: "none",
  // borderColor: "border",
  boxShadow: "0px 0px 0px 1px var(--border) inset",
  fontFamily: "body",
  fontWeight: "body",
  fontSize: "input",
  color: "text",
  outline: "none",
  ":focus": {
    boxShadow: "0px 0px 0px 1.5px var(--primary) inset",
  },
  ":hover:not(:focus)": {
    boxShadow: "0px 0px 0px 1px var(--dimPrimary) inset",
  },
};

const clean: SxStyleProp = {
  variant: "forms.input",
  outline: "none",
  boxShadow: "none",
  ":focus": {
    boxShadow: "none",
  },
  ":hover:not(:focus)": {
    boxShadow: "none",
  },
};

const error: SxStyleProp = {
  variant: "forms.input",
  boxShadow: "0px 0px 0px 1px var(--error) inset",
  outline: "none",
  ":focus": {
    boxShadow: "0px 0px 0px 1.5px var(--error) inset",
  },
  ":hover:not(:focus)": {
    boxShadow: "0px 0px 0px 1px var(--error) inset",
  },
};

export const inputVariants = {
  input: defaultVariant,
  error,
  clean,
};
