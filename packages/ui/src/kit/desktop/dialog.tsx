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

import { useEffect, useRef } from "react";
import { useEscape } from "../shared/use-escape";
import { Pressable } from "react-native";
import type * as Contract from "../contracts/dialog";
import type { UIElement } from "../contracts/elements";
import type { ThemeScopeName } from "../contracts/style";
import { Close, Loading } from "../shared/icons";
import { Button, Flex, Text } from "./primitives";
import { ScrollContainer } from "./layout";
import { ThemeScope, useThemeContext } from "./theme";
import { useStyled } from "./style/use-styled";

const AnyPressable = Pressable as any;

/** The theme scope a `theme-scope-<name>` class asks for, as on the web. */
export function scopeOfClassName(
  ...classNames: (string | undefined)[]
): string | undefined {
  for (const className of classNames) {
    const match = className?.match(/(?:^|\s)theme-scope-([\w-]+)/);
    if (match) return match[1];
  }
  return undefined;
}

function escapeEvent(element: UIElement | null) {
  const native = {
    key: "Escape",
    code: "Escape",
    repeat: false,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    preventDefault: () => {},
    stopPropagation: () => {}
  };
  return {
    ...native,
    target: element ?? {},
    currentTarget: element,
    nativeEvent: native
  } as never;
}

function ModalContent(props: Contract.ModalProps) {
  const {
    shouldCloseOnEsc = true,
    shouldCloseOnOverlayClick = true,
    shouldFocusAfterRender = true,
    onRequestClose
  } = props;
  const content = useRef<UIElement>(null);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(() => {
    if (shouldFocusAfterRender) content.current?.focus?.();
    callbacks.current.onAfterOpen?.();
    return () => callbacks.current.onAfterClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEscape(
    onRequestClose
      ? () => onRequestClose(escapeEvent(content.current))
      : undefined,
    shouldCloseOnEsc
  );

  const scope = scopeOfClassName(props.overlayClassName, props.className);
  const testId = props.data?.["test-id"] ?? props.testId;
  const modal = (
    <Flex
      id={props.id}
      data-test-id={testId ? `${testId}-overlay` : "modal-overlay"}
      onClick={
        shouldCloseOnOverlayClick && onRequestClose
          ? (event) => onRequestClose(event as never)
          : undefined
      }
      // react-modal's defaults, then the caller's.
      sx={
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          bg: "backdrop",
          ...props.style?.overlay
        } as never
      }
    >
      <Flex
        ref={content}
        data-test-id={testId ?? "modal-content"}
        aria-label={props.contentLabel}
        onClick={(event) => event.stopPropagation()}
        sx={
          {
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            flexDirection: "column",
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: 4,
            padding: 20,
            overflow: "hidden",
            ...props.style?.content
          } as never
        }
      >
        {props.children}
      </Flex>
    </Flex>
  );
  return scope ? (
    <ThemeScope scope={scope as ThemeScopeName}>{modal}</ThemeScope>
  ) : (
    modal
  );
}

/**
 * react-modal's `Modal`: its children show only while `isOpen`, over an
 * overlay that covers the window, and `onRequestClose` is called on Escape and
 * on a click on the overlay. It is drawn where it is rendered (there is no
 * portal), so render it at the root of the window as dialogs are.
 */
export const Modal: typeof Contract.Modal = Object.assign(
  function Modal(props: Contract.ModalProps) {
    if (!props.isOpen) return null;
    return <ModalContent {...props} />;
  },
  {
    // The web hides the app element from screen readers; nothing to do here.
    setAppElement: () => {}
  }
);
