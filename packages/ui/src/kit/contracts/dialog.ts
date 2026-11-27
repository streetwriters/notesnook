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
