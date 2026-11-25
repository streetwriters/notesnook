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
import type { UIElement } from "./elements";
import type { UIKeyboardEvent, UIMouseEvent } from "./events";
import type { ButtonProps } from "./primitives";
import type { StyleProp, SxProp } from "./style";

export interface ModalStyles {
  content?: StyleProp;
  overlay?: StyleProp;
}

export interface ModalProps {
  isOpen: boolean;
  onRequestClose?: (event: UIMouseEvent | UIKeyboardEvent) => void;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
  shouldCloseOnEsc?: boolean;
  shouldCloseOnOverlayClick?: boolean;
  shouldFocusAfterRender?: boolean;
  shouldReturnFocusAfterClose?: boolean;
  style?: ModalStyles;
  className?: string;
  overlayClassName?: string;
  contentLabel?: string;
  id?: string;
  testId?: string;
  data?: Record<string, string | undefined>;
  children?: ReactNode;
}

export declare const Modal: {
  (props: ModalProps): JSX.Element | null;
  setAppElement(element: string | UIElement): void;
};

/** @deprecated Build dialog buttons with `Button`, as apps/web's dialog does. */
export interface DialogButtonProps {
  text: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  role?: string;
  variant?: ButtonProps["variant"];
  "data-test-id"?: string;
  /** @deprecated Use `data-test-id`. */
  testID?: string;
  sx?: SxProp;
}

/** @deprecated Use `Modal`. */
export interface DialogProps {
  "data-test-id"?: string;
  /** @deprecated Use `data-test-id`. */
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

/** @deprecated Use `Modal`. */
export declare function Dialog(props: DialogProps): JSX.Element | null;
/** @deprecated Build dialog buttons with `Button`, as apps/web's dialog does. */
export declare function DialogButton(props: DialogButtonProps): JSX.Element;
