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

import { Virtualizer } from "@tanstack/react-virtual";
import { Flex } from "@theme-ui/components";
import React, { useRef } from "react";
import { TableVirtuoso } from "react-virtuoso";

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
  getItemKey: (index: number) => string;
  scrollElement?: HTMLElement | null;
  context?: C;
  renderRow: (props: VirtualizedTableRowProps<T, C>) => JSX.Element | null;
  header: React.ReactNode;
  style?: React.CSSProperties;
};
export function VirtualizedTable<T, C>(props: VirtualizedTableProps<T, C>) {
  const {
    items,
    getItemKey,
    scrollElement,
    renderRow: Row,
    estimatedSize,
    mode,
    header,
    context,
    style
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Flex
      ref={containerRef}
      variant="columnFill"
      sx={{ height: estimatedSize * items.length }}
    >
      <TableVirtuoso
        data={items}
        context={context}
        customScrollParent={
          scrollElement ||
          containerRef.current?.closest(".ms-container") ||
          undefined
        }
        increaseViewportBy={300}
        computeItemKey={(index) => getItemKey(index)}
        defaultItemHeight={estimatedSize}
        fixedHeaderContent={() => <>{header}</>}
        fixedItemHeight={mode === "fixed" ? estimatedSize : undefined}
        components={{
          Table: (props) => (
            <table {...props} style={{ ...style, ...props.style }} />
          ),
          TableRow: (props) => {
            return (
              <Row
                index={props["data-item-index"]}
                item={props.item}
                style={props.style || {}}
                context={props.context}
              />
            );
          }
        }}
      />
    </Flex>
  );

  //

  // const virtualizer = useVirtualizer({
  //   count: items.length,
  //   estimateSize: () => estimatedSize,
  //   getItemKey,
  //   getScrollElement: () =>
  //     scrollElement || containerRef.current?.closest(".ms-container") || null,
  //   scrollMargin: scrollMargin || containerRef.current?.offsetTop || 0
  // });

  // if (virtualizerRef) virtualizerRef.current = virtualizer;

  // const virtualItems = virtualizer.getVirtualItems();
  // return (
  //   <Box
  //     ref={containerRef}
  //     sx={{
  //       height: virtualizer.getTotalSize() + headerSize
  //     }}
  //   >
  //     <table style={style}>
  //       <thead>{header}</thead>
  //       <tbody>
  //         {virtualItems.map((row, index) => (
  //           <Row
  //             key={row.key}
  //             item={items[row.index]}
  //             index={row.index}
  //             rowRef={mode === "dynamic" ? virtualizer.measureElement : null}
  //             context={context}
  //             style={{
  //               height: mode === "dynamic" ? "unset" : `${row.size}px`,
  //               transform: `translateY(${
  //                 row.start -
  //                 index * row.size -
  //                 virtualizer.options.scrollMargin
  //               }px)`
  //             }}
  //           />
  //         ))}
  //       </tbody>
  //     </table>
  //   </Box>
  // );
}
