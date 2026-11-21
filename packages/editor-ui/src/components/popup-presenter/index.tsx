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
import { create } from "zustand";
import {
  Popover,
  ResponsivePresenter as UIResponsivePresenter,
  type SxProp
} from "@ui";
import {
  useIsMobile,
  useToolbarStore
} from "../../toolbar/stores/toolbar-store.js";
import React from "react";
import {
  PopupAnchorProps,
  ResponsivePresenter,
  ResponsivePresenterProps,
  usePopupAnchor
} from "../responsive/index.js";

export type PopupAnchor = PopupAnchorProps;

export type PopupWrapperProps = UsePopupHandlerOptions &
  PopupAnchor & {
    autoCloseOnUnmount?: boolean;
    sx?: SxProp;
    scope?: string;
    blocking?: boolean;
    focusOnRender?: boolean;
  };

export function PopupWrapper(props: PropsWithChildren<PopupWrapperProps>) {
  const { id, children, autoCloseOnUnmount, sx } = props;
  const { closePopup, isPopupOpen } = usePopupHandler(props);
  const isMobile = useIsMobile();
  const anchor = usePopupAnchor({ ...props, isOpen: isPopupOpen });

  useEffect(() => {
    if (!autoCloseOnUnmount) return;
    return () => {
      closePopup(id);
    };
  }, [autoCloseOnUnmount, id, closePopup]);

  const Presenter = isMobile ? UIResponsivePresenter : Popover;
  return (
    <Presenter
      key={id}
      isOpen={isPopupOpen}
      onClose={() => closePopup(id)}
      sx={sx}
      {...anchor}
    >
      {children}
    </Presenter>
  );
}

type ShownPopup = {
  id: number;
  props: Partial<ResponsivePresenterProps>;
  popup: (closePopup: () => void) => React.ReactNode;
};

const useShownPopups = create<{ popups: ShownPopup[] }>(() => ({
  popups: []
}));
let nextPopupId = 0;

type ShowPopupOptions = {
  popup: (closePopup: () => void) => React.ReactNode;
} & Partial<ResponsivePresenterProps>;

export function showPopup(options: ShowPopupOptions) {
  const { popup, ...props } = options;
  const id = ++nextPopupId;
  function hide() {
    useShownPopups.setState((state) => ({
      popups: state.popups.filter((p) => p.id !== id)
    }));
  }
  useShownPopups.setState((state) => ({
    popups: [...state.popups, { id, props, popup }]
  }));
  return hide;
}

export function PopupHost() {
  const popups = useShownPopups((state) => state.popups);
  return (
    <>
      {popups.map(({ id, props, popup }) => {
        const hide = () =>
          useShownPopups.setState((state) => ({
            popups: state.popups.filter((p) => p.id !== id)
          }));
        return (
          <ResponsivePresenter
            key={id}
            desktop="popup"
            mobile="sheet"
            {...props}
            isOpen
            onClose={() => {
              hide();
              props.onClose?.();
            }}
          >
            {popup(hide)}
          </ResponsivePresenter>
        );
      })}
    </>
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
