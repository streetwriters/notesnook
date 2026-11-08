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

import type { ReactNode } from "react";
import type { ButtonProps } from "./primitives";
import type { SxProp } from "./style";

export interface DialogButtonProps {
  text: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  role?: string;
  variant?: ButtonProps["variant"];
  testID?: string;
  sx?: SxProp;
}

export interface DialogProps {
  testID?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  width?: number | string;
  height?: number | string;
  showCloseButton?: boolean;
  textAlignment?: "left" | "right" | "center";
  buttonsAlignment?: "start" | "center" | "end";
  title?: string;
  titleAction?: ReactNode;
  description?: string;
  positiveButton?: DialogButtonProps | null;
  negativeButton?: DialogButtonProps | null;
  footer?: ReactNode;
  noScroll?: boolean;
  sx?: SxProp;
  children?: ReactNode;
}

export declare function Dialog(props: DialogProps): JSX.Element | null;
export declare function DialogButton(props: DialogButtonProps): JSX.Element;
