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

import { useEffect, PropsWithChildren } from "react";
import {
  PositionOptions,
  PopupPresenterProps,
  PopupPresenter
} from "@notesnook/ui";
import {
  getPopupContainer,
  getPopupRoot,
  getToolbarElement,
  unmountPopupRoot
} from "../../toolbar/utils/dom.js";
import {
  useIsMobile,
  useToolbarStore
} from "../../toolbar/stores/toolbar-store.js";
import React from "react";
import { ResponsivePresenter, ResponsivePresenterProps } from "../responsive/index.js";

export type PopupWrapperProps = UsePopupHandlerOptions & {
  autoCloseOnUnmount?: boolean;
  position: PositionOptions;
} & Partial<Omit<PopupPresenterProps, "onClose" | "isOpen">>;
export function PopupWrapper(props: PropsWithChildren<PopupWrapperProps>) {
  const { id, position, children, autoCloseOnUnmount, ...presenterProps } =
    props;
  const { closePopup, isPopupOpen } = usePopupHandler(props);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!autoCloseOnUnmount) return;
    return () => {
      closePopup(id);
    };
  }, [autoCloseOnUnmount, id, closePopup]);

  return (
    <PopupPresenter
      key={id}
      onClose={() => closePopup(id)}
      position={position}
      blocking
      focusOnRender
      className={isMobile ? "editor-mobile-toolbar-popup" : undefined}
      isMobile={isMobile}
      container={getPopupContainer()}
      {...presenterProps}
      isOpen={isPopupOpen}
    >
      {children}
    </PopupPresenter>
  );
}

type UsePopupHandlerOptions = {
  id: string;
  group: string;
  onClosed?: () => void;
};
export function usePopupHandler(options: UsePopupHandlerOptions) {
  const { id, onClosed, group } = options;
  const openedPopups = useToolbarStore((store) => store.openedPopups);
  const closePopup = useToolbarStore((store) => store.closePopup);
  const closePopupGroup = useToolbarStore((store) => store.closePopupGroup);

  const isPopupOpen = typeof openedPopups[id] === "object";
  const isPopupDefined = typeof openedPopups[id] !== "undefined";

  useEffect(() => {
    // we don't want to close the popup just when it is about to open.
    if (!isPopupOpen && isPopupDefined) onClosed?.();
  }, [isPopupOpen, isPopupDefined, onClosed]);

  useEffect(() => {
    // if another popup in the same group is open, close it.
    if (isPopupOpen) {
      closePopupGroup(group, [id]);
    }
  }, [onClosed, isPopupOpen, closePopupGroup, id, group]);

  return { isPopupOpen, closePopup };
}

type ShowPopupOptions = {
  popup: (closePopup: () => void) => React.ReactNode;
} & Partial<ResponsivePresenterProps>;
export function showPopup(options: ShowPopupOptions) {
  const { popup, ...props } = options;

  function hide() {
    unmountPopupRoot();
  }

  getPopupRoot().render(
    <ResponsivePresenter
      isOpen
      position={{
        target: getToolbarElement(),
        isTargetAbsolute: true,
        location: "below",
        align: "end",
        yOffset: 10
      }}
      blocking
      focusOnRender
      container={getPopupContainer()}
      {...props}
      onClose={() => {
        hide();
        props.onClose?.();
      }}
    >
      {popup(hide)}
    </ResponsivePresenter>
  );

  return hide;
}
