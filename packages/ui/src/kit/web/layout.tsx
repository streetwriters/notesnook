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

import {
  Children,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactElement
} from "react";
import type * as Contract from "../contracts/layout";
import { config } from "@platform";
import { Box, Flex } from "./primitives";
import { injectBaseStyles } from "./style/engine";

export const TITLE_BAR_HEIGHT = 45;

export function Pane(_props: Contract.PaneProps): JSX.Element | null {
  return null;
}

type PaneState = {
  id: string;
  min: number;
  max: number;
  snap: number;
  initial: number | undefined;
};

function readSizes(autoSaveId: string | undefined, panes: PaneState[]) {
  return panes.map((pane) => {
    const saved = autoSaveId
      ? config.get<number | undefined>(`csp:${autoSaveId}-${pane.id}`)
      : undefined;
    return saved ?? pane.initial;
  });
}

export const SplitPane = forwardRef<
  Contract.SplitPaneHandle,
  Contract.SplitPaneProps
>(function SplitPane(props, ref) {
  const { direction, autoSaveId, allowResize = true, sashSize = 5 } = props;
  const horizontal = direction === "vertical";
  const children = useMemo(
    () =>
      Children.toArray(props.children).filter(
        (child): child is ReactElement<Contract.PaneProps> =>
          isValidElement(child)
      ),
    [props.children]
  );
  const panes = useMemo<PaneState[]>(
    () =>
      children.map((child) => ({
        id: child.props.id,
        min: child.props.minSize ?? 0,
        max: child.props.maxSize ?? Infinity,
        snap: child.props.snapSize ?? 0,
        initial: child.props.initialSize
      })),
    [children]
  );
  const [sizes, setSizes] = useState<(number | undefined)[]>(() =>
    readSizes(autoSaveId, panes)
  );
  const latest = useRef(sizes);
  const container = useRef<HTMLDivElement>(null);
  const expanded = useRef<Record<string, number>>({});
  const onChange = useRef(props.onChange);
  onChange.current = props.onChange;
  const ids = panes.map((pane) => pane.id).join("|");

  useEffect(() => {
    const next = readSizes(autoSaveId, panes);
    latest.current = next;
    setSizes(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, autoSaveId]);

  const persist = (next: (number | undefined)[]) => {
    if (!autoSaveId) return;
    next.forEach((size, index) => {
      const key = `csp:${autoSaveId}-${panes[index].id}`;
      if (size === undefined) config.remove(key);
      else config.set(key, size);
    });
  };

  const commit = (next: (number | undefined)[], save = true) => {
    latest.current = next;
    setSizes(next);
    if (save) persist(next);
    const total = container.current
      ? horizontal
        ? container.current.clientWidth
        : container.current.clientHeight
      : 0;
    const fixed = next.reduce<number>((sum, size) => sum + (size ?? 0), 0);
    onChange.current?.(
      next.map((size) => (size === undefined ? Math.max(0, total - fixed) : size))
    );
  };

  const clamp = (pane: PaneState, size: number) => {
    if (pane.snap > 0 && size < pane.snap) return pane.min;
    return Math.max(pane.min, Math.min(pane.max, size));
  };

  useImperativeHandle(ref, () => ({
    collapse: (index) => {
      const pane = panes[index];
      const current = sizes[index];
      if (!pane || current === undefined || current === pane.min) return;
      expanded.current[pane.id] = current;
      config.set(`csp:${autoSaveId}-${pane.id}:expanded`, current);
      commit(sizes.map((size, i) => (i === index ? pane.min : size)));
    },
    expand: (index) => {
      const pane = panes[index];
      if (!pane) return;
      const size =
        expanded.current[pane.id] ??
        config.get<number | undefined>(
          `csp:${autoSaveId}-${pane.id}:expanded`
        ) ??
        pane.initial;
      commit(sizes.map((s, i) => (i === index ? size : s)));
    },
    reset: (index) => {
      const pane = panes[index];
      if (!pane) return;
      commit(sizes.map((s, i) => (i === index ? pane.initial : s)));
    },
    isCollapsed: (index) => !!panes[index] && sizes[index] === panes[index].min,
    hasExpandedSize: (index) =>
      !!panes[index] &&
      (expanded.current[panes[index].id] !== undefined ||
        config.get<number | undefined>(
          `csp:${autoSaveId}-${panes[index].id}:expanded`
        ) !== undefined)
  }));

  const gesture = useRef<
    { start: number; size: number; index: number } | undefined
  >(undefined);
  const position = (event: { clientX: number; clientY: number }) =>
    horizontal ? event.clientX : event.clientY;

  const items: JSX.Element[] = [];
  children.forEach((child, index) => {
    const size = sizes[index];
    const fixed = size !== undefined;
    items.push(
      <Flex
        key={child.props.id}
        testID={child.props.testID ?? `pane-${child.props.id}`}
        sx={{
          flexDirection: "column",
          ...(fixed
            ? {
                [horizontal ? "width" : "height"]: size,
                flexShrink: 0,
                overflow: "hidden"
              }
            : { flex: 1 }),
          ...child.props.sx
        }}
      >
        {child.props.children}
      </Flex>
    );
    if (index < children.length - 1) {
      const resizable = allowResize && fixed && size! >= 0;
      items.push(
        <div
          key={`sash-${index}`}
          data-test-id={`${props.testID ?? "split-pane"}-sash-${index}`}
          onPointerDown={(event) => {
            if (!resizable) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            gesture.current = {
              start: position(event),
              size: size ?? 0,
              index
            };
          }}
          onPointerMove={(event) => {
            const start = gesture.current;
            if (!start) return;
            commit(
              latest.current.map((current, i) =>
                i === start.index
                  ? clamp(
                      panes[start.index],
                      start.size + position(event) - start.start
                    )
                  : current
              ),
              false
            );
          }}
          onPointerUp={() => {
            if (gesture.current) persist(latest.current);
            gesture.current = undefined;
          }}
          style={{
            position: "relative",
            flexShrink: 0,
            [horizontal ? "width" : "height"]: 0,
            zIndex: 1,
            overflow: "visible"
          }}
        >
          <div
            style={{
              position: "absolute",
              ...(horizontal
                ? { top: 0, bottom: 0, left: -sashSize / 2, width: sashSize }
                : { left: 0, right: 0, top: -sashSize / 2, height: sashSize }),
              cursor: resizable
                ? horizontal
                  ? "col-resize"
                  : "row-resize"
                : undefined
            }}
          />
        </div>
      );
    }
  });

  return (
    <Box
      testID={props.testID}
      sx={{
        flexDirection: horizontal ? "row" : "column",
        flex: 1,
        ...props.sx
      }}
    >
      <div
        ref={container}
        style={{
          display: "flex",
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          flexDirection: horizontal ? "row" : "column"
        }}
      >
        {items}
      </div>
    </Box>
  );
});

export function ScrollContainer(props: Contract.ScrollContainerProps) {
  return (
    <Box
      testID={props.testID}
      sx={
        {
          overflowY: "auto",
          overflowX: "hidden",
          "> *": { flexShrink: 0 },
          ...props.sx
        } as never
      }
    >
      {props.children}
    </Box>
  );
}

export function TitleBar({
  height = TITLE_BAR_HEIGHT,
  sx,
  children
}: Contract.TitleBarProps) {
  return (
    <Flex
      testID="title-bar"
      sx={{
        flexDirection: "row",
        alignItems: "center",
        height,
        flexShrink: 0,
        ...sx
      }}
    >
      {children}
    </Flex>
  );
}

export function LayoutRoot(props: Contract.LayoutRootProps) {
  injectBaseStyles();
  return (
    <Flex
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        bg: "background",
        color: "paragraph",
        fontFamily: "body",
        fontSize: "body"
      }}
    >
      {props.children}
    </Flex>
  );
}
