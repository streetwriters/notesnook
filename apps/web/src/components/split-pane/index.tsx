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

import "./styles.css";
import React, {
  useEffect,
  useMemo,
  useCallback,
  useRef,
  PropsWithChildren,
  useLayoutEffect,
  useImperativeHandle
} from "react";
import Pane from "./pane";
import Sash from "./sash";
import {
  classNames,
  bodyDisableUserSelect,
  paneClassName,
  splitClassName,
  splitDragClassName,
  splitVerticalClassName,
  splitHorizontalClassName,
  sashDisabledClassName,
  sashHorizontalClassName,
  sashVerticalClassName,
  assertsSize
} from "./base";
import { IAxis, ISplitProps, IPaneConfigs } from "./types";
import Config from "../../utils/config";
export { Pane };

type PaneOptions = {
  min: number;
  max: number;
  snap: number;
  size: number;
  nextSize?: number;
  initialSize: number;
  collapsed: boolean;
};

export type SplitPaneImperativeHandle = {
  collapse: (index: number) => void;
  expand: (index: number) => void;
  isCollapsed: (index: number) => boolean;
};
export const SplitPane = React.forwardRef<
  SplitPaneImperativeHandle,
  PropsWithChildren<ISplitProps>
>(function SplitPane(
  {
    children,
    allowResize = true,
    direction = "vertical",
    className: wrapClassName,
    sashStyle,
    sashRender = (_, active) => (
      <div
        className={classNames(
          "split-sash-content",
          active && "split-sash-content-active"
        )}
      />
    ),
    sashSize: resizerSize = 5,
    onChange = () => null,
    onDragStart = () => null,
    onDragEnd = () => null,
    autoSaveId,
    ...others
  },
  ref
) {
  const axis = useRef<IAxis>({ x: 0, y: 0 });
  const wrapper = useRef<HTMLDivElement>(null);
  const sashPosSizes = useRef<number[]>([]);
  const panes = useRef<(HTMLDivElement | null)[]>([]);
  const sashes = useRef<(HTMLDivElement | null)[]>([]);
  const paneSizes = useRef<PaneOptions[]>([]);
  const wrapSize = useRef(0);
  const childrenLength = childrenToArray(children).length;
  const autoSaveKey = autoSaveId ? `csp:${autoSaveId}` : undefined;
  const lastCollapsedPaneSize = useRef(0);

  const { sizeName, splitPos, splitAxis } = useMemo(
    () =>
      ({
        sizeName: direction === "vertical" ? "width" : "height",
        splitPos: direction === "vertical" ? "left" : "top",
        splitAxis: direction === "vertical" ? "x" : "y"
      } as const),
    [direction]
  );

  const updatePaneLimitSizes = useCallback(
    (children: React.ReactNode) => {
      paneSizes.current =
        childrenToArray(children).map((childNode) => {
          const limits: PaneOptions = {
            min: 0,
            max: Infinity,
            snap: 0,
            size: Infinity,
            initialSize: Infinity,
            collapsed: false
          };
          if (React.isValidElement(childNode) && childNode.type === Pane) {
            const { minSize, maxSize, snapSize, initialSize, id, collapsed } =
              childNode.props as IPaneConfigs;
            limits.min = assertsSize(minSize, wrapSize.current, 0);
            limits.max = assertsSize(maxSize, wrapSize.current);
            limits.snap = assertsSize(snapSize, wrapSize.current, 0);
            limits.initialSize = assertsSize(initialSize, wrapSize.current);

            Object.defineProperty(limits, "collapsed", {
              get() {
                return Config.get(`${autoSaveKey}-${id}:collapsed`, collapsed);
              },
              set(v) {
                if (v == null) Config.remove(`${autoSaveKey}-${id}:collapsed`);
                else Config.set(`${autoSaveKey}-${id}:collapsed`, v);
              }
            });
            Object.defineProperty(limits, "size", {
              get() {
                return Config.get(
                  `${autoSaveKey}-${id}`,
                  assertsSize(initialSize, wrapSize.current)
                );
              },
              set(v) {
                if (v === null || v === undefined || v === Infinity)
                  Config.remove(`${autoSaveKey}-${id}`);
                else Config.set(`${autoSaveKey}-${id}`, v);
              }
            });
          }
          return limits;
        }) || [];
    },
    [autoSaveKey]
  );

  useLayoutEffect(() => {
    if (wrapSize.current === 0) {
      wrapSize.current =
        wrapper.current?.getBoundingClientRect()[sizeName] || 0;
    }

    if (wrapSize.current === 0) return;
    updatePaneLimitSizes(children);
    setSizes(paneSizes.current, wrapSize.current, true);
  }, [children, childrenLength]);

  const setSizes = useCallback(
    function setSizes(
      paneLimits: PaneOptions[],
      wrapSize: number,
      notify = true
    ) {
      const normalized = normalizeSizes(children, paneLimits, wrapSize);
      sashPosSizes.current = normalized.reduce(
        (a, b) => [...a, a[a.length - 1] + b],
        [0]
      );

      for (let i = 0; i < panes.current.length; ++i) {
        const pane = panes.current[i];
        if (!pane) continue;
        const size = normalized[i];
        const sashPos = sashPosSizes.current[i];
        const limits = paneSizes.current[i];
        pane.style[sizeName] = `${size}px`;
        pane.style[splitPos] = `${sashPos}px`;
        if (limits.collapsed || size === limits.min)
          pane.classList.add("collapsed");
        else pane.classList.remove("collapsed");
      }

      for (let i = 0; i < sashes.current.length; ++i) {
        const sash = sashes.current[i];
        const sashPos = sashPosSizes.current[i + 1];
        if (sash) {
          sash.style[splitPos] = `${sashPos - resizerSize / 2}px`;
        }
      }

      paneSizes.current.forEach((limits, index) => {
        limits.size = normalized[index];
      });

      if (notify) onChange(normalized);
    },
    [children, onChange, sizeName, splitPos, resizerSize]
  );

  useEffect(() => {
    if (!wrapper.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!paneSizes.current.length) return;

      const [entry] = entries;
      const newSize = entry.contentRect ? entry.contentRect[sizeName] : 0;

      const delta = newSize - wrapSize.current;
      if (delta === 0) return;

      // TODO: responsiveness
      // const nextSizes = [...sizes.current];
      // const i = sizes.current.length - 1;
      // const currentSize = sizes.current[i];
      // const currentPaneLimits = paneLimitSizes.current[i];
      // const prevPaneLimits = paneLimitSizes.current[i - 1];

      // if (
      //   delta > 0 &&
      //   prevPaneLimits &&
      //   prevPaneLimits.max < Infinity &&
      //   nextSizes[i - 1] + delta <= prevPaneLimits.max
      // ) {
      //   nextSizes[i - 1] += delta;
      // } else if (delta < 0 && currentSize + delta <= currentPaneLimits.min) {
      //   nextSizes[i - 1] += delta;
      // } else {
      //   nextSizes[i] += delta;
      // }

      wrapSize.current = newSize;
      setSizes(paneSizes.current, wrapSize.current);
    });
    resizeObserver.observe(wrapper.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [sizeName, setSizes]);

  useImperativeHandle(
    ref,
    () => {
      return {
        collapse: (index: number) => {
          paneSizes.current[index].collapsed = true;
          lastCollapsedPaneSize.current = paneSizes.current[index].size;
          setSizes(paneSizes.current, wrapSize.current);
        },
        expand: (index: number) => {
          paneSizes.current[index].collapsed = false;
          paneSizes.current[index].size = lastCollapsedPaneSize.current
            ? lastCollapsedPaneSize.current
            : paneSizes.current[index].initialSize;
          setSizes(paneSizes.current, wrapSize.current);
        },
        isCollapsed: (index: number) => {
          return paneSizes.current[index].collapsed;
        }
      };
    },
    [setSizes]
  );

  const dragStart = useCallback(
    function (e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      document?.body?.classList?.add(bodyDisableUserSelect);
      axis.current = { x: e.pageX, y: e.pageY };
      wrapper.current?.classList.toggle(splitDragClassName, true);
      onDragStart(e);
    },
    [onDragStart]
  );

  const dragEnd = useCallback(
    function (e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      document?.body?.classList?.remove(bodyDisableUserSelect);
      wrapper.current?.classList.toggle(splitDragClassName);
      onDragEnd(e);
    },
    [onDragEnd]
  );

  const onDragging = useCallback(
    function onDragging(
      e: React.MouseEvent<HTMLDivElement, MouseEvent>,
      i: number
    ) {
      const curAxis = { x: e.pageX, y: e.pageY };
      let distanceX = curAxis[splitAxis] - axis.current[splitAxis];
      axis.current = { x: e.pageX, y: e.pageY };

      const currentPane = paneSizes.current[i];
      const nextPane = paneSizes.current[i + 1];
      const rightBorder = sashPosSizes.current[i + 2];

      if (currentPane.size + distanceX >= rightBorder)
        distanceX = rightBorder - currentPane.size;

      // if current pane size is out of limit, adjust the previous pane
      if (
        currentPane.size + distanceX >= currentPane.max ||
        currentPane.size + distanceX <= currentPane.min
      ) {
        if (i > 0) {
          // reset axis
          axis.current[splitAxis] += -distanceX;
          onDragging(e, i - 1);
        }
        return;
      }

      currentPane.nextSize =
        (currentPane.nextSize || currentPane.size) + distanceX;
      // keep the next pane size in the min-max range
      nextPane.nextSize = Math.min(
        nextPane.max,
        Math.max(nextPane.min, (nextPane.nextSize || nextPane.size) - distanceX)
      );

      // snapping logic
      if (currentPane.snap > 0) {
        if (distanceX < 0 && currentPane.nextSize <= currentPane.snap / 2) {
          currentPane.nextSize = currentPane.min;
        } else if (currentPane.nextSize < currentPane.snap) {
          // reset axis
          axis.current[splitAxis] += -distanceX;
          return;
        }
      }
      nextPane.size = nextPane.nextSize;
      currentPane.size = currentPane.nextSize;
      nextPane.nextSize = undefined;
      currentPane.nextSize = undefined;

      setSizes(paneSizes.current, wrapSize.current);
    },
    [paneSizes, setSizes, splitAxis]
  );

  return (
    <div
      className={classNames(
        splitClassName,
        direction === "vertical" && splitVerticalClassName,
        direction === "horizontal" && splitHorizontalClassName,
        wrapClassName
      )}
      ref={wrapper}
      {...others}
    >
      {childrenToArray(children).map((childNode, childIndex) => {
        const isPane = React.isValidElement(childNode)
          ? childNode.type === Pane
          : false;
        const paneProps =
          isPane && React.isValidElement(childNode) ? childNode.props : {};

        return (
          <Pane
            id={paneProps.id}
            key={childIndex}
            paneRef={(e) => (panes.current[childIndex] = e)}
            className={classNames(paneClassName, paneProps.className)}
            style={{ ...paneProps.style }}
          >
            {isPane ? paneProps.children : childNode}
          </Pane>
        );
      })}
      {new Array(childrenLength - 1).fill(0).map((_, index) => (
        <Sash
          key={index}
          sashRef={(e) => (sashes.current[index] = e)}
          className={classNames(
            !allowResize && sashDisabledClassName,
            direction === "vertical"
              ? sashVerticalClassName
              : sashHorizontalClassName
          )}
          style={{
            [sizeName]: resizerSize,
            ...sashStyle
          }}
          render={sashRender.bind(null, index)}
          onDragStart={dragStart}
          onDragging={(e) => onDragging(e, index)}
          onDragEnd={dragEnd}
          onDoubleClick={() => {
            paneSizes.current[index].size =
              paneSizes.current[index].initialSize;
            setSizes(paneSizes.current, wrapSize.current);
          }}
        />
      ))}
    </div>
  );
});

function childrenToArray(children: React.ReactNode) {
  return React.Children.toArray(children);
}

function normalizeSizes(
  children: React.ReactNode,
  panes: PaneOptions[],
  wrapSize: number
): number[] {
  let count = 0;
  let curSum = 0;
  const res = childrenToArray(children).map((_, index) => {
    const initialSize = panes[index].initialSize;
    const size = panes[index].collapsed ? panes[index].min : panes[index].size;
    initialSize === Infinity ? count++ : (curSum += size);
    return size;
  });

  if (count > 0 || curSum > wrapSize) {
    const average = (wrapSize - curSum) / count;
    return res.map((size, index) => {
      const initialSize = panes[index].initialSize;
      return initialSize === Infinity ? average : size;
    });
  }

  return res;
}
