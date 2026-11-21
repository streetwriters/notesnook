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
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type * as Contract from "../contracts/lists";
import {
  computeOffsets,
  scrollOffsetFor,
  visibleRange
} from "../shared/virtual-window";
import { Flex } from "./primitives";
import { isEscapeForOpenMenu } from "./use-dom";

const DEFAULT_OVERSCAN = 200;

// Only the items in (and `overscan` pixels around) the viewport are mounted.
// Items are absolutely positioned at offsets computed from measured sizes,
// falling back to `estimatedItemSize` until an item has been laid out.
export const VirtualList = forwardRef<
  Contract.VirtualListHandle,
  Contract.VirtualListProps
>(function VirtualList(props, ref) {
  const { count, renderItem, itemKey, estimatedItemSize, header } = props;
  const overscan = props.overscan ?? DEFAULT_OVERSCAN;
  const container = useRef<HTMLDivElement>(null);
  const headerNode = useRef<HTMLDivElement>(null);
  const sizes = useRef(new Map<number, number>());
  const [version, setVersion] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);

  const offsets = useMemo(
    () => computeOffsets(count, estimatedItemSize, sizes.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, estimatedItemSize, version]
  );

  const observer = useRef<ResizeObserver | undefined>(undefined);
  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (!observer.current)
      observer.current = new ResizeObserver((entries) => {
        let changed = false;
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index);
          const height = entry.target.getBoundingClientRect().height;
          if (!Number.isNaN(index) && height > 0) {
            if (sizes.current.get(index) !== height) {
              sizes.current.set(index, height);
              changed = true;
            }
          }
        }
        if (changed) setVersion((current) => current + 1);
      });
    observer.current.observe(node);
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);

  const hasHeader = !!header;
  useLayoutEffect(() => {
    const node = container.current;
    if (!node) return;
    const update = () => {
      setViewport(node.clientHeight);
      setHeaderHeight(headerNode.current?.offsetHeight ?? 0);
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(node);
    if (headerNode.current) resize.observe(headerNode.current);
    return () => resize.disconnect();
  }, [hasHeader]);

  const scrollToIndex = ({
    index,
    align = "start",
    animated
  }: Contract.ScrollToIndexOptions) => {
    const node = container.current;
    if (!node) return;
    const top =
      headerHeight + scrollOffsetFor(offsets, index, node.clientHeight, align);
    node.scrollTo({
      top: Math.max(0, top),
      behavior: animated ? "smooth" : "auto"
    });
  };
  const latest = useRef(scrollToIndex);
  latest.current = scrollToIndex;
  useImperativeHandle(
    ref,
    () => ({ scrollToIndex: (options) => latest.current(options) }),
    []
  );

  const initial = props.initialScrollIndex;
  useLayoutEffect(() => {
    if (initial !== undefined && initial > 0)
      latest.current({ index: initial });
  }, [initial]);

  const { start, end } = visibleRange(
    offsets,
    Math.max(0, scrollTop - headerHeight),
    viewport,
    overscan
  );
  const items: JSX.Element[] = [];
  for (let index = start; index <= end; index++)
    items.push(
      <div
        key={itemKey(index)}
        ref={measure}
        data-index={index}
        style={{ position: "absolute", top: offsets[index], left: 0, right: 0 }}
      >
        {renderItem(index)}
      </div>
    );

  return (
    <Flex
      testID={props.testID}
      sx={{ flex: 1, overflow: "hidden", ...props.sx }}
    >
      <div
        ref={container}
        tabIndex={0}
        data-extra={props.extraData === undefined ? undefined : ""}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        onBlur={() => props.onBlur?.()}
        onKeyDown={(event) =>
          !isEscapeForOpenMenu(event) &&
          props.onKeyDown?.({
            key: event.key,
            repeat: event.repeat,
            shiftKey: event.shiftKey,
            ctrlKey: event.ctrlKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
            preventDefault: () => event.preventDefault(),
            stopPropagation: () => event.stopPropagation()
          })
        }
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          outline: "none",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {header ? (
          <div ref={headerNode} style={{ flexShrink: 0 }}>
            {header}
          </div>
        ) : null}
        <div
          style={{ position: "relative", flexShrink: 0, height: offsets[count] }}
        >
          {items}
        </div>
      </div>
    </Flex>
  );
});
