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

import { PropsWithChildren } from "react";
import {
  Popover,
  ResponsivePresenter as UIResponsivePresenter,
  type AnchorRect,
  type MenuItem,
  type PopoverPlacement,
  type SxProp,
  type UIElement
} from "@ui";
import {
  toolbarRef,
  useIsMobile
} from "../../toolbar/stores/toolbar-store.js";
import { MenuPresenter } from "../menu/index.js";

type ResponsiveContainerProps = {
  mobile?: JSX.Element;
  desktop?: JSX.Element;
};

export function ResponsiveContainer(props: ResponsiveContainerProps) {
  const isMobile = useIsMobile();
  if (isMobile) return props.mobile || null;
  else return props.desktop || null;
}

export function DesktopOnly(props: PropsWithChildren<unknown>) {
  return <ResponsiveContainer desktop={<>{props.children}</>} />;
}

export function MobileOnly(props: PropsWithChildren<unknown>) {
  return <ResponsiveContainer mobile={<>{props.children}</>} />;
}

type DomRectSource = {
  getBoundingClientRect(): {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

export type PositionOptions = {
  target?: UIElement | DomRectSource | "mouse" | null;
  location?: "below" | "top" | "left" | "right";
  align?: "start" | "center" | "end";
  isTargetAbsolute?: boolean;
  yOffset?: number;
  xOffset?: number;
};

export type PopupType = "sheet" | "menu" | "none" | "popup";
export type ResponsivePresenterProps = {
  isOpen: boolean;
  onClose: () => void;
  mobile?: PopupType;
  desktop?: PopupType;
  items?: MenuItem[];
  title?: string;
  anchorRef?: React.RefObject<UIElement | null>;
  anchorRect?: AnchorRect;
  placement?: PopoverPlacement;
  position?: PositionOptions;
  sx?: SxProp;
  blocking?: boolean;
  focusOnRender?: boolean;
};

export function resolveAnchor(props: {
  anchorRef?: React.RefObject<UIElement | null>;
  anchorRect?: AnchorRect;
  placement?: PopoverPlacement;
  position?: PositionOptions;
}): {
  anchorRef?: React.RefObject<UIElement | null>;
  anchorRect?: AnchorRect;
  placement: PopoverPlacement;
} {
  const { position } = props;
  const above = position?.location === "top";
  const end = position?.align === "end";
  const placement =
    props.placement ??
    (`${above ? "top" : "bottom"}-${end ? "end" : "start"}` as PopoverPlacement);
  if (props.anchorRect || props.anchorRef)
    return {
      anchorRef: props.anchorRef,
      anchorRect: props.anchorRect,
      placement
    };
  const target = position?.target;
  if (target && typeof target === "object") {
    if ("measureInWindow" in target)
      return { anchorRef: { current: target }, placement };
    if ("getBoundingClientRect" in target) {
      const rect = target.getBoundingClientRect();
      return {
        anchorRect: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        },
        placement
      };
    }
  }
  return { anchorRef: toolbarRef, placement };
}

export function ResponsivePresenter(
  props: PropsWithChildren<ResponsivePresenterProps>
) {
  const {
    mobile = "menu",
    desktop = "menu",
    isOpen,
    onClose,
    items,
    sx,
    children
  } = props;
  const isMobile = useIsMobile();
  const type = isMobile ? mobile : desktop;
  const anchor = resolveAnchor(props);

  if (type === "none") return isOpen ? <>{children}</> : null;
  if (type === "menu")
    return (
      <MenuPresenter
        isOpen={isOpen}
        onClose={onClose}
        items={items || []}
        sx={sx}
        {...anchor}
      />
    );
  if (type === "sheet")
    return (
      <UIResponsivePresenter isOpen={isOpen} onClose={onClose} sx={sx} {...anchor}>
        {children}
      </UIResponsivePresenter>
    );
  return (
    <Popover isOpen={isOpen} onClose={onClose} sx={sx} {...anchor}>
      {children}
    </Popover>
  );
}
