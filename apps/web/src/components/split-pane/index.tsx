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
  useState,
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

export type SplitPaneImperativeHandle = {
  collapse: (index: number) => void;
  expand: (index: number) => void;
};
export const SplitPane = React.forwardRef<
  SplitPaneImperativeHandle,
  PropsWithChildren<ISplitProps>
>(function SplitPane(
  {
    children,
    initialSizes,
    allowResize = true,
    direction = "vertical",
    className: wrapClassName,
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
  const [wrapperRect, setWrapperRect] = useState<DOMRect | null>();
  const sizes = useRef<number[]>([]);
  const sashPosSizes = useRef<number[]>([]);
  const panes = useRef<(HTMLDivElement | null)[]>([]);
  const sashes = useRef<(HTMLDivElement | null)[]>([]);
  const wrapSize = useRef(0);

  const { sizeName, splitPos, splitAxis } = useMemo(
    () =>
      ({
        sizeName: direction === "vertical" ? "width" : "height",
        splitPos: direction === "vertical" ? "left" : "top",
        splitAxis: direction === "vertical" ? "x" : "y"
      } as const),
    [direction]
  );

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      const rect = wrapper?.current?.getBoundingClientRect() ?? null;
      wrapSize.current = rect ? rect[sizeName] : 0;
      setWrapperRect(rect);
    });
    resizeObserver.observe(wrapper.current!);
    return () => {
      resizeObserver.disconnect();
    };
  }, [sizeName]);

  // Get limit sizes via children
  const paneLimitSizes = useMemo(
    () =>
      childrenToArray(children).map((childNode) => {
        const limits = { min: 0, max: Infinity, snap: 0 };
        if (React.isValidElement(childNode) && childNode.type === Pane) {
          const { minSize, maxSize, snapSize } =
            childNode.props as IPaneConfigs;
          limits.min = assertsSize(minSize, wrapSize.current, 0);
          limits.max = assertsSize(maxSize, wrapSize.current);
          limits.snap = assertsSize(snapSize, wrapSize.current, 0);
        }
        return limits;
      }) || [],
    [children, wrapSize]
  );

  useLayoutEffect(() => {
    if (wrapSize.current === 0) return;

    setSizes(
      sizes.current.length === childrenToArray(children).length
        ? sizes.current
        : Config.get(`csp:${autoSaveId}`, initialSizes),
      wrapSize.current,
      false
    );
  }, [wrapperRect, initialSizes, children]);

  const setSizes = useCallback(
    function setSizes(
      paneSizes: (number | string)[],
      wrapSize: number,
      notify = true
    ) {
      sizes.current = normalizeSizes(
        children,
        paneSizes,
        initialSizes,
        wrapSize
      );
      sashPosSizes.current = sizes.current.reduce(
        (a, b) => [...a, a[a.length - 1] + b],
        [0]
      );

      for (let i = 0; i < panes.current.length; ++i) {
        const pane = panes.current[i];
        const size = sizes.current[i];
        const sashPos = sashPosSizes.current[i];
        if (!pane) continue;
        pane.style[sizeName] = `${size}px`;
        pane.style[splitPos] = `${sashPos}px`;
      }

      for (let i = 0; i < sashes.current.length; ++i) {
        const sash = sashes.current[i];
        const sashPos = sashPosSizes.current[i + 1];
        if (sash) {
          sash.style[splitPos] = `${sashPos - resizerSize / 2}px`;
        }
      }

      if (autoSaveId) Config.set(`csp:${autoSaveId}`, sizes.current);
      if (notify) onChange(sizes.current);
    },
    [
      children,
      initialSizes,
      onChange,
      autoSaveId,
      sizeName,
      splitPos,
      resizerSize
    ]
  );

  useImperativeHandle(
    ref,
    () => {
      return {
        collapse: (index: number) => {
          const nextSizes = [...sizes.current];
          nextSizes[index] = paneLimitSizes[index].min;
          nextSizes[index + 1] += sizes.current[index];
          setSizes(nextSizes, wrapSize.current);
        },
        expand: (index: number) => {
          const nextSizes = [...sizes.current];
          nextSizes[index] = assertsSize(initialSizes[index], wrapSize.current);
          nextSizes[index + 1] += sizes.current[index];
          setSizes(nextSizes, wrapSize.current);
        }
      };
    },
    [initialSizes, paneLimitSizes, setSizes]
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
      axis.current = { x: e.pageX, y: e.pageY };
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

      const currentSize = sizes.current[i];
      const currentPaneLimits = paneLimitSizes[i];
      const nextPaneLimits = paneLimitSizes[i + 1];
      const rightBorder = sashPosSizes.current[i + 2];

      if (currentSize + distanceX >= rightBorder)
        distanceX = rightBorder - currentSize;

      const nextSizes = [...sizes.current];

      // if current pane size is out of limit, adjust the previous pane
      if (
        currentSize + distanceX > currentPaneLimits.max ||
        currentSize + distanceX < currentPaneLimits.min
      ) {
        if (i - 1 >= 0) {
          // reset axis
          axis.current[splitAxis] += -distanceX;
          onDragging(e, i - 1);
        }
        return;
      }

      nextSizes[i] += distanceX;
      // keep the next pane size in the min-max range
      nextSizes[i + 1] = Math.min(
        nextPaneLimits.max,
        Math.max(nextPaneLimits.min, nextSizes[i + 1] - distanceX)
      );

      // snapping logic
      if (currentPaneLimits.snap > 0) {
        if (distanceX < 0 && nextSizes[i] <= currentPaneLimits.snap / 2) {
          nextSizes[i] = currentPaneLimits.min;
        } else if (nextSizes[i] < currentPaneLimits.snap) {
          // reset axis
          axis.current[splitAxis] += -distanceX;
          return;
        }
      }

      setSizes(nextSizes, wrapSize.current);
    },
    [paneLimitSizes, setSizes, splitAxis]
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
      {React.Children.map(children, (childNode, childIndex) => {
        if (!childNode) return null;

        const isPane = React.isValidElement(childNode)
          ? childNode.type === Pane
          : false;
        const paneProps =
          isPane && React.isValidElement(childNode) ? childNode.props : {};

        return (
          <Pane
            key={childIndex}
            paneRef={(e) => (panes.current[childIndex] = e)}
            className={classNames(paneClassName, paneProps.className)}
            style={{ ...paneProps.style }}
          >
            {isPane ? paneProps.children : childNode}
          </Pane>
        );
      })}
      {new Array(childrenToArray(children).length - 1)
        .fill(0)
        .map((_, index) => (
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
              [sizeName]: resizerSize
            }}
            render={sashRender.bind(null, index)}
            onDragStart={dragStart}
            onDragging={(e) => onDragging(e, index)}
            onDragEnd={dragEnd}
            onDoubleClick={() => {
              sizes.current[index] = assertsSize(
                initialSizes[index],
                wrapSize.current
              );
              setSizes(sizes.current, wrapSize.current);
            }}
          />
        ))}
    </div>
  );
});

function childrenToArray(children: React.ReactNode) {
  return React.Children.toArray(children).filter(Boolean);
}

function normalizeSizes(
  children: React.ReactNode,
  currentSizes: (string | number)[],
  initialSizes: (string | number)[],
  wrapSize: number
): number[] {
  let count = 0;
  let curSum = 0;
  const res = childrenToArray(children).map((_, index) => {
    const initialSize = assertsSize(initialSizes[index], wrapSize);
    const size = assertsSize(currentSizes[index], wrapSize);
    initialSize === Infinity ? count++ : (curSum += size);
    return size;
  });

  if (!res) return [];

  if (count > 0 || curSum > wrapSize) {
    const average = (wrapSize - curSum) / count;
    return res.map((size, index) => {
      const initialSize = assertsSize(initialSizes[index], wrapSize);
      return initialSize === Infinity ? average : size;
    });
  }

  return res;
}
