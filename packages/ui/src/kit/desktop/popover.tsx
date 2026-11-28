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

import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import type * as Contract from "../contracts/overlays";
import type { UIElement } from "../contracts/primitives";
import { popoverPosition } from "../shared/popover-position";
import { popupPosition, type PopupSize } from "../shared/popup-position";
import { useEscape } from "../shared/use-escape";
import { activeElement, measureInWindow } from "./element";
import { useWindowSize } from "./hooks";
import { lastPointer } from "./style/use-styled";
import { Box, Flex } from "./primitives";
import { ThemeScope } from "./theme";

type Entry = {
  id: number;
  rect: { x: number; y: number; width: number; height: number };
  props: Contract.PopoverProps;
};

const useStore = create<{ entries: Entry[] }>(() => ({ entries: [] }));

let counter = 0;

function put(entry: Entry) {
  useStore.setState((state) => ({
    entries: [...state.entries.filter((e) => e.id !== entry.id), entry]
  }));
}

function remove(id: number) {
  useStore.setState((state) => ({
    entries: state.entries.filter((e) => e.id !== id)
  }));
}

export function Popover(props: Contract.PopoverProps) {
  const [id] = useStable();

  useEffect(() => {
    if (!props.isOpen) {
      remove(id);
      return;
    }
    if (props.anchorRect) {
      put({ id, rect: props.anchorRect, props });
      return;
    }
    measureInWindow(props.anchorRef?.current, (x, y, width, height) =>
      put({ id, rect: { x, y, width, height }, props })
    );
  });

  useEffect(() => () => remove(id), [id]);
  return null;
}

const DEFAULT_SHEET_BREAKPOINT = 600;

export function ResponsivePresenter(props: Contract.ResponsivePresenterProps) {
  const { sheetBreakpoint = DEFAULT_SHEET_BREAKPOINT, ...popover } = props;
  const window = useWindowSize();
  if (window.width >= sheetBreakpoint) return <Popover {...popover} />;

  // Sheet: a full-width panel pinned to the bottom edge of the window.
  return (
    <Popover
      {...popover}
      anchorRect={{ x: 0, y: window.height, width: window.width, height: 0 }}
      placement="top-start"
      sx={{
        ...popover.sx,
        width: window.width,
        borderRadius: "radius2"
      }}
    />
  );
}

function useStable() {
  return useState(() => ++counter);
}

export function PopoverHost() {
  const entries = useStore((state) => state.entries);
  const window = useWindowSize();
  return (
    <>
      {entries.map((entry) => (
        <PopoverEntry key={entry.id} entry={entry} window={window} />
      ))}
    </>
  );
}

function PopoverEntry(props: {
  entry: Entry;
  window: { width: number; height: number };
}) {
  const { entry, window } = props;
  const { rect, props: popover } = entry;
  const ref = useRef<UIElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>();

  useEffect(() => {
    let cancelled = false;
    measureInWindow(ref.current, (_x, _y, width, height) => {
      popoverPosition(
        rect,
        { width, height },
        popover.placement ?? "bottom-start",
        window
      ).then((next) => {
        if (cancelled) return;
        setPosition((current) =>
          current?.top === next.top && current?.left === next.left
            ? current
            : next
        );
      });
    });
    return () => {
      cancelled = true;
    };
  });

  return (
    <ThemeScope scope="contextMenu">
      <Box
        onClick={popover.onClose}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000
        }}
      >
        <Flex
          ref={ref}
          onClick={(event) => event.stopPropagation()}
          sx={{
            position: "absolute",
            top: position?.top ?? rect.y,
            left: position?.left ?? rect.x,
            opacity: position ? 1 : 0,
            bg: "background",
            borderRadius: "radius2",
            boxShadow: "menu",
            ...popover.sx
          }}
        >
          {popover.children}
        </Flex>
      </Box>
    </ThemeScope>
  );
}

function measure(element: UIElement): Promise<Contract.AnchorRect> {
  const rect = (element as Partial<UIElement>).getBoundingClientRect?.();
  if (rect)
    return Promise.resolve({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height
    });
  return new Promise((resolve) =>
    measureInWindow(element, (x, y, width, height) =>
      resolve({ x, y, width, height })
    )
  );
}

async function anchorOf(
  position: Contract.PositionOptions | undefined,
  pointer: { x: number; y: number }
): Promise<Contract.AnchorRect> {
  const target = position?.target;
  if (!target || target === "mouse")
    return { x: pointer.x, y: pointer.y, width: 0, height: 0 };
  const rect = await measure(target);
  if (!position.yAnchor) return rect;
  const anchor = await measure(position.yAnchor);
  return { x: rect.x, y: anchor.y, width: rect.width, height: anchor.height };
}

function Presenter(props: Contract.PopupPresenterProps) {
  const {
    isOpen: _isOpen,
    position,
    onClose,
    blocking = true,
    focusOnRender = true,
    movable: _movable,
    isMobile: _isMobile,
    container: _container,
    scope,
    children,
    sx,
    ...rest
  } = props;
  const window = useWindowSize();
  const content = useRef<UIElement>(null);
  const frame = useRef<UIElement>(null);
  const [windowOrigin, setWindowOrigin] = useState<{ x: number; y: number }>();
  // A popup at the pointer stays where the pointer was when it opened.
  const [pointer] = useState(() => ({ x: lastPointer.x, y: lastPointer.y }));
  const [anchor, setAnchor] = useState<Contract.AnchorRect>();
  const [size, setSize] = useState<PopupSize>();
  useEscape(onClose, true);

  useEffect(() => {
    let cancelled = false;
    anchorOf(position, pointer).then((next) => {
      if (!cancelled) setAnchor(next);
    });
    return () => {
      cancelled = true;
    };
  }, [position, pointer, window.width, window.height]);

  // The popup's own size is known only once it is laid out, and changes with
  // its content (a lazy menu item loading), so it is read after every render.
  useEffect(() => {
    let cancelled = false;
    measureInWindow(content.current, (_x, _y, width, height) => {
      if (cancelled) return;
      setSize((current) =>
        current?.width === width && current?.height === height
          ? current
          : { width, height }
      );
    });
    return () => {
      cancelled = true;
    };
  });

  // The presenter is drawn where it is rendered, which can be inside a positioned
  // parent (a footer item). Its absolute layers start there, so its own window
  // position is read after every render, as the popup's size is.
  useEffect(() => {
    let cancelled = false;
    measureInWindow(frame.current, (x, y) => {
      if (cancelled) return;
      setWindowOrigin((current) =>
        current?.x === x && current?.y === y ? current : { x, y }
      );
    });
    return () => {
      cancelled = true;
    };
  });

  useEffect(() => {
    if (!focusOnRender) return;
    // As react-modal on the web: the element that had the focus gets it back
    // when the popup closes, so the keyboard carries on where it was.
    const previous = activeElement();
    content.current?.focus?.();
    return () => previous?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placed =
    anchor && size
      ? popupPosition(anchor, size, position ?? {}, window)
      : undefined;
  const origin = windowOrigin ?? { x: 0, y: 0 };
  // A blocking popup sits in a layer that starts at the window's origin, so it
  // is placed in window coordinates. A non-blocking one is drawn in place, so
  // it is shifted by the presenter's own origin.
  const shift = blocking ? { x: 0, y: 0 } : origin;
  const popup = (
    <Flex
      data-test-id="popup-presenter"
      {...rest}
      ref={content}
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: "absolute",
        zIndex: 1000,
        top: (placed?.top ?? anchor?.y ?? 0) - shift.y,
        left: (placed?.left ?? anchor?.x ?? 0) - shift.x,
        maxHeight: placed?.maxHeight,
        // Drawn invisibly first, to be measured before it is placed.
        opacity: placed ? 1 : 0,
        ...sx
      }}
    >
      {children}
    </Flex>
  );
  // A blocking popup covers the window: a click outside it closes it and
  // reaches nothing else. A non-blocking one leaves the window usable.
  const layer = blocking ? (
    <Box
      data-test-id="popup-backdrop"
      onClick={onClose}
      onContextMenu={(event) => {
        event.preventDefault();
        onClose();
      }}
      sx={{
        position: "absolute",
        top: -origin.y,
        left: -origin.x,
        width: window.width,
        height: window.height,
        zIndex: 1000
      }}
    >
      {popup}
    </Box>
  ) : (
    popup
  );
  const body = (
    <Box
      ref={frame}
      sx={{ position: "absolute", top: 0, left: 0, width: 0, height: 0 }}
    >
      {layer}
    </Box>
  );
  return scope ? <ThemeScope scope={scope}>{body}</ThemeScope> : body;
}

/**
 * `PopupPresenter` from `@notesnook/ui`: shows its children as a popup placed
 * by `position` while `isOpen`, and calls `onClose` on Escape and on a click
 * outside it. `movable`, `isMobile` and `container` are accepted and unused.
 */
export function PopupPresenter(props: Contract.PopupPresenterProps) {
  if (!props.isOpen) return null;
  return <Presenter {...props} />;
}
