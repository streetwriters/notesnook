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
import React, { useRef } from "react";

export type VirtualizedTableRowProps<T, C> = {
  item: T;
  index: number;
  style: React.CSSProperties;
  rowRef?: React.Ref<HTMLTableRowElement>;
  context?: C;
};

type VirtualizedTableProps<T, C> = {
  virtualizerRef?: React.MutableRefObject<
    Virtualizer<Element, Element> | undefined
  >;
  mode?: "fixed" | "dynamic";
  items: T[];
  estimatedSize: number;
  headerSize: number;
  getItemKey: (index: number) => string;
  scrollElement?: Element | null;
  context?: C;
  renderRow: (props: VirtualizedTableRowProps<T, C>) => JSX.Element | null;
  scrollMargin?: number;
  header: React.ReactNode;
  style?: React.CSSProperties;
};
export function VirtualizedTable<T, C>(props: VirtualizedTableProps<T, C>) {
  const {
    items,
    getItemKey,
    scrollElement,
    scrollMargin,
    headerSize,
    renderRow: Row,
    estimatedSize,
    mode,
    virtualizerRef,
    header,
    style,
    context
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize: () => estimatedSize,
    getItemKey,
    getScrollElement: () =>
      scrollElement || containerRef.current?.closest(".ms-container") || null,
    scrollMargin: scrollMargin || containerRef.current?.offsetTop || 0
  });

  if (virtualizerRef) virtualizerRef.current = virtualizer;

  const virtualItems = virtualizer.getVirtualItems();
  return (
    <Box
      ref={containerRef}
      sx={{
        height: virtualizer.getTotalSize() + headerSize
      }}
    >
      <table style={style}>
        <thead>{header}</thead>
        <tbody>
          {virtualItems.map((row, index) => (
            <Row
              key={row.key}
              item={items[row.index]}
              index={row.index}
              rowRef={mode === "dynamic" ? virtualizer.measureElement : null}
              context={context}
              style={{
                height: mode === "dynamic" ? "unset" : `${row.size}px`,
                transform: `translateY(${
                  row.start -
                  index * row.size -
                  virtualizer.options.scrollMargin
                }px)`
              }}
            />
          ))}
        </tbody>
      </table>
    </Box>
  );
}
