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
import { useIsMobile } from "../../toolbar/stores/toolbar-store.js";
import {
  ActionSheetPresenter,
  ActionSheetPresenterProps
} from "../action-sheet/index.js";
import {
  MenuPresenter,
  MenuPresenterProps,
  PopupPresenter
} from "@notesnook/ui";
import { getPopupContainer } from "../../toolbar/utils/dom.js";

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

export type PopupType = "sheet" | "menu" | "none" | "popup";
export type ResponsivePresenterProps = MenuPresenterProps &
  ActionSheetPresenterProps & {
    mobile?: PopupType;
    desktop?: PopupType;
  };

export function ResponsivePresenter(
  props: PropsWithChildren<ResponsivePresenterProps>
) {
  const { mobile = "menu", desktop = "menu", ...restProps } = props;
  const isMobile = useIsMobile();
  if (isMobile && mobile === "sheet")
    return <ActionSheetPresenter {...restProps} />;
  else if (mobile === "menu" || desktop === "menu")
    return <MenuPresenter {...restProps} />;
  else if (mobile === "popup" || desktop === "popup") {
    return <PopupPresenter container={getPopupContainer()} {...restProps} />;
  } else return props.isOpen ? <>{props.children}</> : null;
}
