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

import { Virtualizer, useVirtualizer } from "@tanstack/react-virtual";
import { Box } from "@theme-ui/components";
import React, { useEffect, useRef } from "react";

type VirtualizedGridProps<T> = {
  virtualizerRef?: React.MutableRefObject<
    Virtualizer<Element, Element> | undefined
  >;
  mode?: "fixed" | "dynamic";
  items: T[];
  estimatedSize: number;
  getItemKey: (index: number) => string;
  scrollElement?: Element | null;
  renderItem: (props: { item: T; index: number }) => JSX.Element | null;
  scrollMargin?: number;
  columns: number;
  onEndReached?: () => void;
};
export function VirtualizedGrid<T>(props: VirtualizedGridProps<T>) {
  const {
    items,
    getItemKey,
    scrollElement,
    scrollMargin,
    renderItem: Item,
    estimatedSize,
    mode,
    virtualizerRef,
    columns,
    onEndReached
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    lanes: columns,
    count: items.length,
    estimateSize: () => estimatedSize,
    getItemKey,
    getScrollElement: () =>
      scrollElement || containerRef.current?.closest(".ms-container") || null,
    scrollMargin: scrollMargin || containerRef.current?.offsetTop || 0
  });

  useEffect(() => {
    if (!virtualizer.scrollElement || !onEndReached) return;
    function onScroll() {
      if (!virtualizer.scrollElement) return;
      const { clientHeight, scrollHeight, scrollTop } =
        virtualizer.scrollElement;
      const endThreshold = scrollHeight - clientHeight - 50;
      if (scrollTop > endThreshold) {
        onEndReached?.();
      }
    }
    (virtualizer.scrollElement as HTMLElement)?.addEventListener(
      "scroll",
      onScroll
    );
    return () => {
      (virtualizer.scrollElement as HTMLElement)?.removeEventListener(
        "scroll",
        onScroll
      );
    };
  }, [virtualizer.scrollElement, onEndReached]);

  if (virtualizerRef) virtualizerRef.current = virtualizer;

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <Box ref={containerRef} className="Grid">
      <Box
        sx={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative"
        }}
      >
        {virtualItems.map((row) => (
          <Box
            key={row.key}
            data-index={row.index}
            ref={mode === "dynamic" ? virtualizer.measureElement : null}
            style={{
              position: "absolute",
              top: 0,
              left: `${(100 / columns) * row.lane}%`,
              width: `${100 / columns}%`,
              height: mode === "dynamic" ? "unset" : `${row.size}px`,
              transform: `translateY(${
                row.start - virtualizer.options.scrollMargin
              }px)`
            }}
          >
            <Item key={row.key} item={items[row.index]} index={row.index} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
