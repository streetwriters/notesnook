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
import { createPortal } from "react-dom";
import type * as Contract from "../contracts/overlays";
import type { UIElement } from "../contracts/primitives";
import { popoverPosition } from "../shared/popover-position";
import { useEscape } from "../shared/use-escape";
import { useWindowSize } from "./hooks";
import { Flex } from "./primitives";
import { ThemeScope } from "./theme";

type Rect = { x: number; y: number; width: number; height: number };

/**
 * Draws the popover beside its anchor, in a layer on `document.body`. It needs
 * no `PopoverHost`: apps/web never mounted one, so popovers opened and did
 * nothing (the same at the baseline).
 */
export function Popover(props: Contract.PopoverProps) {
  const [rect, setRect] = useState<Rect>();
  useEscape(props.onClose, props.isOpen);

  useEffect(() => {
    const next = props.isOpen ? anchorOf(props) : undefined;
    setRect((current) => (sameRect(current, next) ? current : next));
  });

  if (!props.isOpen || !rect) return null;
  return createPortal(
    <PopoverEntry rect={rect} popover={props} />,
    document.body
  );
}

function anchorOf(props: Contract.PopoverProps): Rect | undefined {
  if (props.anchorRect) return props.anchorRect;
  const anchor = props.anchorRef?.current?.getBoundingClientRect();
  if (!anchor) return undefined;
  return {
    x: anchor.left,
    y: anchor.top,
    width: anchor.width,
    height: anchor.height
  };
}

function sameRect(a?: Rect, b?: Rect) {
  return (
    a === b ||
    (!!a &&
      !!b &&
      a.x === b.x &&
      a.y === b.y &&
      a.width === b.width &&
      a.height === b.height)
  );
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

/**
 * Kept so existing mounts keep compiling. Popovers draw themselves now, so
 * there is nothing for a host to draw.
 */
export function PopoverHost() {
  return null;
}

function PopoverEntry(props: { rect: Rect; popover: Contract.PopoverProps }) {
  const { rect, popover } = props;
  const viewport = useWindowSize();
  const ref = useRef<UIElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>();

  useEffect(() => {
    let cancelled = false;
    const size = ref.current?.getBoundingClientRect();
    if (size)
      popoverPosition(
        rect,
        { width: size.width, height: size.height },
        popover.placement ?? "bottom-start",
        viewport
      ).then((next) => {
        if (cancelled) return;
        setPosition((current) =>
          current?.top === next.top && current?.left === next.left
            ? current
            : next
        );
      });
    return () => {
      cancelled = true;
    };
  });

  // A fixed layer covers the viewport: a click outside the popover closes it,
  // and the popover is placed in viewport coordinates, as it was measured.
  return (
    <ThemeScope scope="contextMenu">
      <div
        onClick={popover.onClose}
        style={{
          position: "fixed",
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
      </div>
    </ThemeScope>
  );
}
