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

import { PropsWithChildren, useMemo } from "react";
import {
  Popover,
  ResponsivePresenter as UIResponsivePresenter,
  type AnchorRect,
  type MenuItem,
  type PopoverPlacement,
  type SxProp,
  type UIElement
} from "@ui";
import { toolbarRef, useIsMobile } from "../../toolbar/stores/toolbar-store.js";
import { MenuPresenter } from "../menu/index.js";
import type { AnyEditor } from "../../controller.js";
import { useAnchorQuery } from "../../queries/hooks.js";
import {
  pickPopupAnchor,
  toPopoverRect,
  type ResolvedAnchor
} from "./anchor.js";
import type { AnchorTarget } from "../../queries/queries.js";

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

/**
 * Where a popup opens. A popup that belongs to the document (the selection,
 * a node, a link) is anchored with `editor` + `anchor`, which the editor's
 * `anchor` query measures. A popup that belongs to a toolbar control is
 * anchored to that control with `anchorRef`. `anchorRect` is for a rect the
 * caller already has. With none of them the popup opens at the toolbar.
 */
export type PopupAnchorProps = {
  /** Anchor to a toolbar control, e.g. the button that opened the popup. */
  anchorRef?: React.RefObject<UIElement | null>;
  /** Anchor to a rect in window coordinates. */
  anchorRect?: AnchorRect;
  /** Anchor to what the editor's `anchor` query measures. Needs `editor`. */
  anchor?: AnchorTarget;
  editor?: AnyEditor;
  placement?: PopoverPlacement;
};

export type { ResolvedAnchor };

/**
 * Resolves where a popup opens: an explicit rect, else the editor's anchor
 * query (while the popup is open), else a control, else the toolbar.
 */
export function usePopupAnchor(
  props: PopupAnchorProps & { isOpen?: boolean }
): ResolvedAnchor {
  const { anchorRef, anchorRect, anchor, editor, isOpen = true } = props;
  const measured = useAnchorQuery(
    isOpen && anchor && !anchorRect ? editor : undefined,
    anchor
  );
  const queried = useMemo(() => toPopoverRect(measured), [measured]);
  return pickPopupAnchor({
    anchorRect,
    measured: queried,
    anchorRef,
    fallbackRef: toolbarRef,
    placement: props.placement
  });
}

export type PopupType = "sheet" | "menu" | "none" | "popup";
export type ResponsivePresenterProps = PopupAnchorProps & {
  isOpen: boolean;
  onClose: () => void;
  mobile?: PopupType;
  desktop?: PopupType;
  items?: MenuItem[];
  title?: string;
  sx?: SxProp;
  blocking?: boolean;
  focusOnRender?: boolean;
};

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
  const anchor = usePopupAnchor(props);

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
      <UIResponsivePresenter
        isOpen={isOpen}
        onClose={onClose}
        sx={sx}
        {...anchor}
      >
        {children}
      </UIResponsivePresenter>
    );
  return (
    <Popover isOpen={isOpen} onClose={onClose} sx={sx} {...anchor}>
      {children}
    </Popover>
  );
}
