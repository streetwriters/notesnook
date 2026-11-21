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

import React, { PropsWithChildren, useCallback, useRef, useState } from "react";
import {
  Button,
  Flex,
  Icon,
  ResponsivePresenter as UIResponsivePresenter,
  Text,
  type MenuItem
} from "@ui";
import { Icons } from "../../toolbar/icons.js";
import { MenuButton, MenuSeparator } from "../menu/index.js";

type ActionSheetHistoryItem = {
  title?: string;
  items?: MenuItem[];
};

function useHistory<T>(initial: T) {
  const [current, setCurrent] = useState<T | undefined>(initial);
  const [canGoBack, setCanGoBack] = useState(false);
  const stack = useRef<T[]>([initial]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    const prev = stack.current.pop();
    setCurrent(prev);
    if (stack.current.length <= 1) setCanGoBack(false);
  }, [canGoBack]);

  const navigate = useCallback((state: T) => {
    setCurrent((prev) => {
      if (prev) stack.current.push(prev);
      return state;
    });

    setCanGoBack(true);
  }, []);

  return { current, goBack, navigate, canGoBack };
}

export type ActionSheetPresenterProps = {
  items?: MenuItem[];
  isOpen: boolean;
  onClose?: () => void;
  /** @deprecated the `@ui` sheet is always modal. Kept for API compatibility. */
  blocking?: boolean;
  /** @deprecated focus is handled by the `@ui` sheet. Kept for API compatibility. */
  focusOnRender?: boolean;
  /** @deprecated swipe to dismiss is handled by the `@ui` sheet. Kept for API compatibility. */
  draggable?: boolean;
  title?: string;
};

/**
 * A bottom sheet listing `items` (or `children`), with title and submenu
 * navigation. It is drawn by `@ui`'s `ResponsivePresenter` pinned to the
 * sheet layout (`sheetBreakpoint={Infinity}`), so it needs no anchor and no
 * DOM of its own.
 */
export function ActionSheetPresenter(
  props: PropsWithChildren<ActionSheetPresenterProps>
) {
  const { isOpen, title, items, onClose, children } = props;

  return (
    <UIResponsivePresenter
      isOpen={isOpen}
      onClose={() => onClose?.()}
      sheetBreakpoint={Infinity}
      sx={{ flexDirection: "column", py: 1 }}
    >
      <ContentContainer title={title} items={items} onClose={onClose}>
        {children}
      </ContentContainer>
    </UIResponsivePresenter>
  );
}

type ContentContainerProps = {
  title?: string;
  items?: MenuItem[];
  onClose?: () => void;
};
function ContentContainer(props: PropsWithChildren<ContentContainerProps>) {
  const { title, items, onClose, children } = props;

  const { current, goBack, canGoBack, navigate } =
    useHistory<ActionSheetHistoryItem>({
      title,
      items
    });

  return (
    <Flex sx={{ flexDirection: "column" }}>
      {canGoBack || current?.title ? (
        <Flex sx={{ alignItems: "center", mx: 0, mb: 1 }}>
          {canGoBack && (
            <Button variant="icon" sx={{ p: 1, ml: 1 }} onPress={goBack}>
              <Icon path={Icons.arrowLeft} size="big" />
            </Button>
          )}
          {current?.title && (
            <Text variant="title" sx={{ ml: 1, fontSize: "title" }}>
              {current.title}
            </Text>
          )}
        </Flex>
      ) : null}
      {children
        ? children
        : current?.items?.map((item) => {
            if (item.isHidden) return null;

            switch (item.type) {
              case "separator":
                return <MenuSeparator key={item.key} />;
              case "button": {
                const { menu, onClick } = item;
                return (
                  <MenuButton
                    key={item.key}
                    // Closing is done by the wrapped `onClick`: the sheet
                    // closes first, then the action runs once the close
                    // animation is over.
                    item={{
                      ...item,
                      onClick: onClick
                        ? () => {
                            onClose?.();
                            setTimeout(() => onClick(), 300);
                          }
                        : undefined
                    }}
                    onClose={noop}
                    onToggleSubmenu={menu ? () => navigate(menu) : undefined}
                  />
                );
              }
              case "popup":
                return (
                  <React.Fragment key={item.key}>
                    <item.component onClick={onClose} />
                  </React.Fragment>
                );
            }
          })}
    </Flex>
  );
}

function noop() {
  // intentionally empty
}
