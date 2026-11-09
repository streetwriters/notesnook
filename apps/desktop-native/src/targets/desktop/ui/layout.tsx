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
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactElement
} from "react";
import {
  experimental_LayoutConformance as LayoutConformance,
  ScrollView,
  View
} from "react-native";
import type * as Contract from "../../../ui/layout";
import { config } from "../platform/config";
import { useStyled } from "./style/use-styled";

const AnyView = View as any;
const AnyScrollView = ScrollView as any;

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

function readPaneSizes(
  autoSaveId: string | undefined,
  panes: PaneState[]
): (number | undefined)[] {
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
    readPaneSizes(autoSaveId, panes)
  );
  const [total, setTotal] = useState(0);
  const [dragging, setDragging] = useState<number | undefined>();
  const expanded = useRef<Record<string, number>>({});
  const onChange = useRef(props.onChange);
  onChange.current = props.onChange;
  const { viewStyle, nativeProps } = useStyled(
    { sx: props.sx, testID: props.testID },
    {
      defaults: {
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        flex: 1
      }
    }
  );

  const commit = useCallback(
    (next: (number | undefined)[]) => {
      setSizes(next);
      if (autoSaveId)
        next.forEach((size, index) => {
          const key = `csp:${autoSaveId}-${panes[index].id}`;
          if (size === undefined) config.remove(key);
          else config.set(key, size);
        });
      const fixed = next.reduce<number>((sum, size) => sum + (size ?? 0), 0);
      onChange.current?.(
        next.map((size) =>
          size === undefined ? Math.max(0, total - fixed) : size
        )
      );
    },
    [autoSaveId, panes, total]
  );

  const clamp = (pane: PaneState, size: number) => {
    if (pane.snap > 0 && size < pane.snap) return 0;
    return Math.max(pane.min, Math.min(pane.max, size));
  };

  useImperativeHandle(
    ref,
    () => ({
      collapse: (index) => {
        const current = sizes[index];
        if (current === undefined || current === 0) return;
        expanded.current[panes[index].id] = current;
        config.set(`csp:${autoSaveId}-${panes[index].id}:expanded`, current);
        commit(sizes.map((size, i) => (i === index ? 0 : size)));
      },
      expand: (index) => {
        const size =
          expanded.current[panes[index].id] ??
          config.get<number | undefined>(
            `csp:${autoSaveId}-${panes[index].id}:expanded`
          ) ??
          panes[index].initial;
        commit(sizes.map((s, i) => (i === index ? size : s)));
      },
      reset: (index) =>
        commit(sizes.map((s, i) => (i === index ? panes[index].initial : s))),
      isCollapsed: (index) => sizes[index] === 0,
      hasExpandedSize: (index) =>
        expanded.current[panes[index].id] !== undefined ||
        config.get<number | undefined>(
          `csp:${autoSaveId}-${panes[index].id}:expanded`
        ) !== undefined
    }),
    [autoSaveId, commit, panes, sizes]
  );

  const gesture = useRef<{ start: number; size: number } | undefined>(
    undefined
  );

  const drag = (index: number, position: number) => {
    const start = gesture.current;
    if (!start) return;
    commit(
      sizes.map((size, i) =>
        i === index
          ? clamp(panes[index], start.size + position - start.start)
          : size
      )
    );
  };

  const endGesture = () => {
    gesture.current = undefined;
    setDragging(undefined);
  };

  const pointerPosition = (event: any) => {
    const pointer = event.nativeEvent ?? event;
    return horizontal
      ? pointer.clientX ?? pointer.pageX
      : pointer.clientY ?? pointer.pageY;
  };

  const items: JSX.Element[] = [];
  children.forEach((child, index) => {
    const size = sizes[index];
    items.push(
      <PaneView
        key={child.props.id}
        horizontal={horizontal}
        size={size}
        pane={child.props}
      />
    );
    if (index < children.length - 1) {
      const resizable =
        allowResize && sizes[index] !== undefined && sizes[index]! >= 0;
      items.push(
        <AnyView
          key={`sash-${index}`}
          style={{
            [horizontal ? "width" : "height"]: 0,
            flexShrink: 0,
            zIndex: 1,
            overflow: "visible"
          }}
        >
          <AnyView
            testID={`${props.testID ?? "split-pane"}-sash-${index}`}
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
            onPointerDown={(event: any) => {
              if (!resizable) return;
              gesture.current = {
                start: pointerPosition(event),
                size: sizes[index] ?? 0
              };
              setDragging(index);
            }}
          />
        </AnyView>
      );
    }
  });

  return (
    <AnyView
      {...nativeProps}
      style={viewStyle}
      onPointerMove={(event: any) => {
        if (dragging !== undefined) drag(dragging, pointerPosition(event));
      }}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onLayout={(event: any) =>
        setTotal(
          horizontal
            ? event.nativeEvent.layout.width
            : event.nativeEvent.layout.height
        )
      }
    >
      {items}
    </AnyView>
  );
});

function PaneView({
  horizontal,
  size,
  pane
}: {
  horizontal: boolean;
  size: number | undefined;
  pane: Contract.PaneProps;
}) {
  const { viewStyle, nativeProps } = useStyled(
    { sx: pane.sx, testID: pane.testID ?? `pane-${pane.id}` },
    { defaults: { display: "flex", flexDirection: "column" } }
  );
  const fixed = size !== undefined;
  return (
    <AnyView
      {...nativeProps}
      style={{
        ...viewStyle,
        ...(fixed
          ? {
              [horizontal ? "width" : "height"]: size,
              flexShrink: 0,
              overflow: "hidden"
            }
          : { flex: 1 })
      }}
    >
      {pane.children}
    </AnyView>
  );
}

export function ScrollContainer(props: Contract.ScrollContainerProps) {
  const { viewStyle, nativeProps } = useStyled({
    sx: props.sx,
    testID: props.testID
  });
  return (
    <AnyScrollView {...nativeProps} style={viewStyle}>
      {props.children}
    </AnyScrollView>
  );
}

export function LayoutRoot(props: Contract.LayoutRootProps) {
  return <LayoutConformance mode="strict">{props.children}</LayoutConformance>;
}
