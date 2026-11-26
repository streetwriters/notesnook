/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React from "react";
import {
  Input as ThemeUIInput,
  InputProps as ThemeUIInputProps
} from "@theme-ui/components";
import { Theme } from "@notesnook/theme";
import {
  RestrictedColorProps,
  RestrictedSpaceProps,
  RestrictedSxProp
} from "../utils/types.js";

export interface InputProps
  extends Omit<
      ThemeUIInputProps,
      "variant" | "sx" | keyof RestrictedSpaceProps | keyof RestrictedColorProps
    >,
    RestrictedSpaceProps,
    RestrictedColorProps {
  variant?: keyof Theme["forms"];
  sx?: RestrictedSxProp;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => {
    return <ThemeUIInput ref={ref} {...(props as any)} />;
  }
);
