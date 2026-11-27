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

import { forwardRef, useCallback, useMemo, type ReactNode } from "react";
import {
  Box,
  Flex,
  Virtuoso,
  type SxProp,
  type VirtuosoHandle
} from "@notesnook/ui-kit";

export type VirtualizedListProps<T, C> = {
  items: T[];
  estimatedSize: number;
  getItemKey: (index: number, items: T[]) => string;
  context?: C;
  renderItem: (props: { item: T; index: number; context: C }) => ReactNode;
  itemGap?: number;
  mode?: "fixed" | "dynamic";
  overscan?: number;
  header?: ReactNode;
  "data-test-id"?: string;
  sx?: SxProp;
};

/** Draws `context.header` above the rows, as the list container does. */
export function ListHeader(props: { context?: { header?: ReactNode } }) {
  return <>{props.context?.header}</>;
}

const WITH_HEADER = { Header: ListHeader };
const NO_COMPONENTS = {};

function VirtualizedListInner<T, C>(
  props: VirtualizedListProps<T, C>,
  ref: React.ForwardedRef<VirtuosoHandle>
) {
  const {
    items,
    getItemKey,
    renderItem: Item,
    estimatedSize,
    context,
    itemGap = 0,
    overscan = 400,
    header,
    sx
  } = props;

  const itemContent = useCallback(
    (index: number) => (
      <Box sx={{ pb: itemGap }}>
        <Item
          item={items[index]}
          index={index}
          context={context || ({} as C)}
        />
      </Box>
    ),
    [items, context, itemGap]
  );
  const computeItemKey = useCallback(
    (index: number) => getItemKey(index, items),
    [getItemKey, items]
  );
  const listContext = useMemo(() => ({ header }), [header]);

  return (
    <Flex
      data-test-id={props["data-test-id"] || "virtualized-list"}
      sx={{ flex: 1, flexDirection: "column", overflow: "hidden", ...sx }}
    >
      <Virtuoso
        ref={ref}
        style={{ flex: 1 }}
        totalCount={items.length}
        computeItemKey={computeItemKey}
        itemContent={itemContent}
        context={listContext}
        components={header ? WITH_HEADER : NO_COMPONENTS}
        defaultItemHeight={estimatedSize + itemGap}
        increaseViewportBy={overscan}
      />
    </Flex>
  );
}

export const VirtualizedList = forwardRef(VirtualizedListInner) as <T, C>(
  props: VirtualizedListProps<T, C> & {
    ref?: React.Ref<VirtuosoHandle>;
  }
) => JSX.Element;
