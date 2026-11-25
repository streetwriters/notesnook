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

import type { BoxProps, IconProps } from "./primitives";
import type { ComponentType, ReactNode, RefObject } from "react";
import type { UIElement } from "./elements";
import type { SxProp, ThemeScopeName } from "./style";

export type MenuIconComponent = ComponentType<Omit<IconProps, "path" | "svg">>;

export type MenuItemComponentProps = {
  onClick?: (event?: unknown) => void;
};

export type MenuItemTypes = "button" | "separator" | "popup" | "lazy-loader";
export type BaseMenuItem<TType extends MenuItemTypes> = {
  type: TType;
  key: string;
  isHidden?: boolean;
  multiSelect?: boolean;
};

export type MenuSeperatorItem = BaseMenuItem<"separator">;

/** @deprecated Use `MenuSeperatorItem`, the name `@notesnook/ui` exports. */
export type MenuSeparatorItem = MenuSeperatorItem;

export type MenuPopupItem = BaseMenuItem<"popup"> & {
  component: ComponentType<MenuItemComponentProps>;
};

export type LazyMenuItemsLoader = BaseMenuItem<"lazy-loader"> & {
  loader?: ReactNode;
  items: () => Promise<MenuItem[]>;
};

export type MenuButtonItem = BaseMenuItem<"button"> & {
  onClick?: () => void;
  title: string;
  icon?: string;
  iconComponent?: MenuIconComponent;
  tooltip?: string;
  isDisabled?: boolean;
  isChecked?: boolean;
  modifier?: string;
  menu?: { title?: string; items: MenuItem[] };
  premium?: boolean;
  variant?: "dangerous" | "normal";
  styles?: {
    title?: SxProp;
    icon?: SxProp;
  };
};

export type MenuItem =
  | MenuButtonItem
  | MenuSeperatorItem
  | MenuPopupItem
  | LazyMenuItemsLoader;

export type PositionOptions = {
  target?: UIElement | "mouse" | null;
  isTargetAbsolute?: boolean;
  location?: "right" | "left" | "below" | "top";
  align?: "center" | "start" | "end";
  yOffset?: number;
  xOffset?: number;
  gap?: number;
  yAnchor?: UIElement;
  parent?: UIElement;
};

export interface PopupPresenterProps extends BoxProps {
  isOpen: boolean;
  onClose: () => void;
  position: PositionOptions;
  blocking?: boolean;
  focusOnRender?: boolean;
  movable?: boolean;
  scope?: ThemeScopeName;
  isMobile?: boolean;
  container?: UIElement;
}

export interface MenuPresenterProps
  extends Omit<PopupPresenterProps, "movable" | "scope" | "title"> {
  items?: MenuItem[];
  title?: string;
}

export declare function PopupPresenter(
  props: PopupPresenterProps
): JSX.Element | null;
export declare function MenuPresenter(
  props: MenuPresenterProps
): JSX.Element | null;

export type ToastType = "success" | "error" | "warn" | "info";
export type ToastAction = {
  text: string;
  onClick: () => void;
  type?: "accent" | "paragraph";
};

export declare function showToast(
  type: ToastType,
  message: string,
  actions?: ToastAction[],
  hideAfter?: number
): { hide: () => void };

export declare function ToastHost(): JSX.Element | null;

export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "right-start";

/** A rectangle in window coordinates. */
export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  /** Element to anchor to. Ignored when `anchorRect` is given. */
  anchorRef?: RefObject<UIElement | null>;
  /** Anchor to a rect (e.g. the caret from the editor's `anchor` query). */
  anchorRect?: AnchorRect;
  placement?: PopoverPlacement;
  sx?: SxProp;
  children?: ReactNode;
}

export declare function Popover(props: PopoverProps): JSX.Element | null;

export interface ResponsivePresenterProps extends PopoverProps {
  /** Window width (px) below which the content is shown as a bottom sheet. */
  sheetBreakpoint?: number;
}

/** Popover on wide windows, bottom sheet on narrow ones (mobile). */
export declare function ResponsivePresenter(
  props: ResponsivePresenterProps
): JSX.Element | null;
export declare function PopoverHost(): JSX.Element | null;

export interface DragPayload {
  ghost?: ReactNode;
  [key: string]: unknown;
}

export declare function DragGhostHost(): JSX.Element | null;
