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

import { LegendList, type LegendListRef } from "@legendapp/list/react-native";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type ComponentType,
  type Key,
  type ReactNode,
  type Ref
} from "react";
import { View } from "react-native";
import type * as Contract from "../contracts/lists";
import { ScrollerSlot } from "./layout";
import { Flex } from "./primitives";
import {
  createScrollElement,
  emptyScrollMetrics,
  syntheticEvent
} from "./scroll-element";
import { useStyled } from "./style/use-styled";
import { keyboardEvent } from "./style/events";
import {
  groupRows,
  resolveScrollIntoView,
  rowOfGroup,
  rowOfIndex,
  rowOfItem,
  toRowTarget,
  type RowResolver
} from "./virtuoso-location";

const AnyView = View as any;

/** The props the three lists share, whatever their rows are. */
type CommonProps = Pick<
  Contract.VirtuosoProps<any, any>,
  | "context"
  | "defaultItemHeight"
  | "fixedItemHeight"
  | "increaseViewportBy"
  | "initialTopMostItemIndex"
  | "id"
  | "style"
  | "tabIndex"
  | "onKeyDown"
  | "onBlur"
> & { "data-test-id"?: string };

type CoreProps = {
  common: CommonProps;
  /** Rows in the native list: items, and group headers in a grouped list. */
  count: number;
  rowKey: (row: number) => Key;
  renderRow: (row: number) => ReactNode;
  rowOf: RowResolver;
  handle: Ref<Contract.GroupedVirtuosoHandle>;
  Scroller?: ComponentType<any>;
  Header?: ComponentType<any>;
  Footer?: ComponentType<any>;
  EmptyPlaceholder?: ComponentType<any>;
};

const DEFAULT_ITEM_HEIGHT = 40;

function VirtuosoCore(props: CoreProps) {
  const { common, count, rowKey, renderRow, rowOf } = props;
  const { Scroller, Header, Footer, EmptyPlaceholder } = props;
  const context = common.context;
  const list = useRef<LegendListRef>(null);
  const wrapper = useRef<any>(null);
  const { viewStyle, nativeProps } = useStyled(
    {
      sx: common.style,
      // react-virtuoso marks its scroller with this id.
      "data-test-id": common["data-test-id"] ?? "virtuoso-scroller",
      id: common.id
    } as never,
    { defaults: { display: "flex", flexDirection: "column", flex: 1 } }
  );
  const element = useMemo(
    () => createScrollElement(() => wrapper.current, emptyScrollMetrics()),
    []
  );

  const latest = useRef({ rowOf, context });
  latest.current = { rowOf, context };

  useImperativeHandle(
    props.handle,
    () => {
      const scrollToRow = (
        location: number | Contract.IndexLocationWithAlign
      ) => {
        const target = toRowTarget(location, latest.current.rowOf);
        if (!target) return Promise.resolve();
        return Promise.resolve(list.current?.scrollToIndex(target));
      };
      const scrollToOffset = (offset: number, behavior?: "auto" | "smooth") =>
        void list.current?.scrollToOffset({
          offset: Math.max(0, offset),
          animated: behavior === "smooth"
        });
      return {
        scrollToIndex: (location) => void scrollToRow(location),
        scrollIntoView: (location) => {
          const into: Contract.ScrollIntoViewLocation =
            typeof location === "number" ? { index: location } : location;
          const finish = () => into.done?.();
          const row = latest.current.rowOf(into);
          const state = list.current?.getState();
          if (row === undefined || !state) return finish();
          const itemTop = state.positionAtIndex(row);
          const size = state.sizeAtIndex(row);
          const {
            done: _done,
            calculateViewLocation: _calculate,
            ...where
          } = into;
          // A row that was never laid out has no position yet: scroll to it.
          const next =
            Number.isFinite(itemTop) && Number.isFinite(size)
              ? resolveScrollIntoView(into, {
                  itemTop,
                  itemBottom: itemTop + size,
                  viewportTop: state.scroll,
                  viewportBottom: state.scroll + state.scrollLength
                })
              : { ...where, align: where.align ?? "start" };
          if (next === null) return finish();
          scrollToRow(next).then(finish, finish);
        },
        scrollTo: ({ top = 0, behavior }) => scrollToOffset(top, behavior),
        scrollBy: ({ top = 0, behavior }) =>
          scrollToOffset((list.current?.getState().scroll ?? 0) + top, behavior)
      };
    },
    []
  );

  const data = useMemo(
    () => Array.from({ length: count }, (_, index) => index),
    [count]
  );
  // The native list can ask once more for a row it held before the list
  // shrank. The caller's callbacks index their data (`nodes[index].id`), as
  // they safely can with react-virtuoso, so such a row is not passed on.
  const keyExtractor = (row: number) =>
    row < count ? String(rowKey(row)) : `stale-${row}`;
  const render = ({ item }: { item: number }) =>
    item < count ? <>{renderRow(item)}</> : null;

  const renderScroll = useMemo(
    () =>
      Scroller
        ? (scrollProps: any) => (
            <ScrollerSlot.Provider value={scrollProps}>
              <Scroller
                context={latest.current.context}
                data-virtuoso-scroller
                tabIndex={-1}
              >
                {scrollProps.children}
              </Scroller>
            </ScrollerSlot.Provider>
          )
        : undefined,
    [Scroller]
  );

  const overscan = common.increaseViewportBy;
  const initial = common.initialTopMostItemIndex;
  const initialRow =
    initial === undefined
      ? undefined
      : rowOf(typeof initial === "number" ? { index: initial } : initial);

  const onKeyDown = common.onKeyDown;
  const onBlur = common.onBlur;
  return (
    <AnyView
      {...nativeProps}
      ref={wrapper}
      style={viewStyle}
      focusable={common.tabIndex !== -1}
      onKeyDown={
        onKeyDown
          ? (event: any) => {
              const key: any = keyboardEvent("keydown", event);
              const native = key.nativeEvent ?? {
                ...key,
                code: key.code || key.key
              };
              onKeyDown({
                ...key,
                code: key.code || key.key,
                target: element,
                currentTarget: element,
                nativeEvent: native
              });
            }
          : undefined
      }
      onBlur={
        onBlur ? () => onBlur(syntheticEvent(element) as never) : undefined
      }
    >
      <LegendList
        ref={list}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={render}
        estimatedItemSize={
          common.fixedItemHeight ??
          common.defaultItemHeight ??
          DEFAULT_ITEM_HEIGHT
        }
        // Rows are drawn by the caller's callbacks, which close over its state:
        // a new callback means the rows may differ, as in react-virtuoso.
        extraData={renderRow}
        drawDistance={
          typeof overscan === "number"
            ? overscan
            : overscan
            ? Math.max(overscan.top, overscan.bottom)
            : undefined
        }
        initialScrollIndex={initialRow}
        ListHeaderComponent={Header ? <Header context={context} /> : undefined}
        ListFooterComponent={Footer ? <Footer context={context} /> : undefined}
        ListEmptyComponent={
          EmptyPlaceholder ? <EmptyPlaceholder context={context} /> : undefined
        }
        renderScrollComponent={renderScroll}
        recycleItems={false}
        style={{ flex: 1 }}
      />
    </AnyView>
  );
}

function commonOf(props: CommonProps): CommonProps {
  return props;
}

function itemProps(index: number, height: number | undefined, item: unknown) {
  return {
    "data-index": index,
    "data-item-index": index,
    "data-known-size": height ?? 0,
    item
  };
}

/**
 * react-virtuoso's `Virtuoso` on the native virtualized list. The list owns
 * its scroll view, so `customScrollParent` is not used here.
 */
export const Virtuoso = forwardRef(function Virtuoso(
  props: Contract.VirtuosoProps<any, any>,
  ref: Ref<Contract.VirtuosoHandle>
) {
  const { data, context, itemContent, computeItemKey, components } = props;
  const count = props.totalCount ?? data?.length ?? 0;
  const Item = components?.Item;
  const height = props.fixedItemHeight ?? props.defaultItemHeight;
  return (
    <VirtuosoCore
      common={commonOf(props)}
      handle={ref as Ref<Contract.GroupedVirtuosoHandle>}
      count={count}
      rowOf={(location) =>
        "index" in location ? rowOfIndex(count, location.index) : undefined
      }
      rowKey={(index) =>
        computeItemKey ? computeItemKey(index, data?.[index], context) : index
      }
      renderRow={(index) => {
        const content = itemContent?.(index, data?.[index], context);
        return Item ? (
          <Item {...itemProps(index, height, data?.[index])} context={context}>
            {content}
          </Item>
        ) : (
          content
        );
      }}
      Scroller={components?.Scroller}
      Header={components?.Header}
      Footer={components?.Footer}
      EmptyPlaceholder={components?.EmptyPlaceholder}
    />
  );
}) as unknown as typeof Contract.Virtuoso;

/**
 * react-virtuoso's `GroupedVirtuoso`. Group headers are rows of the list and
 * scroll with it; they do not stick to the top as they do on the web.
 */
export const GroupedVirtuoso = forwardRef(function GroupedVirtuoso(
  props: Contract.GroupedVirtuosoProps<any, any>,
  ref: Ref<Contract.GroupedVirtuosoHandle>
) {
  const { data, context, itemContent, groupContent, computeItemKey } = props;
  const { components, groupCounts } = props;
  const counts = useMemo(() => groupCounts ?? [], [groupCounts]);
  const rows = useMemo(() => groupRows(counts), [counts]);
  const items = rows.length - counts.length;
  const Item = components?.Item;
  const TopItemList = components?.TopItemList;
  const height = props.fixedItemHeight ?? props.defaultItemHeight;
  return (
    <VirtuosoCore
      common={commonOf(props)}
      handle={ref}
      count={rows.length}
      rowOf={(location) =>
        "groupIndex" in location
          ? rowOfGroup(counts, location.groupIndex)
          : rowOfItem(
              counts,
              location.index === "LAST" ? items - 1 : location.index
            )
      }
      rowKey={(row) => {
        const entry = rows[row];
        if (!entry) return row;
        if (entry.type === "group") return `group-${entry.groupIndex}`;
        return computeItemKey
          ? computeItemKey(entry.index, data?.[entry.index], context)
          : `item-${entry.index}`;
      }}
      renderRow={(row) => {
        const entry = rows[row];
        if (!entry) return null;
        if (entry.type === "group") {
          const header = groupContent?.(entry.groupIndex, context);
          return TopItemList ? (
            <TopItemList context={context}>{header}</TopItemList>
          ) : (
            header
          );
        }
        const content = itemContent?.(
          entry.index,
          entry.groupIndex,
          data?.[entry.index],
          context
        );
        return Item ? (
          <Item
            {...itemProps(entry.index, height, data?.[entry.index])}
            data-item-group-index={entry.groupIndex}
            context={context}
          >
            {content}
          </Item>
        ) : (
          content
        );
      }}
      Scroller={components?.Scroller}
      Header={components?.Header}
      Footer={components?.Footer}
      EmptyPlaceholder={components?.EmptyPlaceholder}
    />
  );
}) as unknown as typeof Contract.GroupedVirtuoso;

/**
 * react-virtuoso's `TableVirtuoso`. There are no table elements here: the
 * fixed header is drawn above the list, and each row is `components.TableRow`
 * (or a row of the cells `itemContent` returns).
 */
export const TableVirtuoso = forwardRef(function TableVirtuoso(
  props: Contract.TableVirtuosoProps<any, any>,
  ref: Ref<Contract.TableVirtuosoHandle>
) {
  const { data, context, itemContent, computeItemKey, components } = props;
  const count = props.totalCount ?? data?.length ?? 0;
  const Table = components?.Table;
  const TableRow = components?.TableRow;
  const height = props.fixedItemHeight ?? props.defaultItemHeight;
  const body = (
    <>
      {props.fixedHeaderContent?.()}
      <VirtuosoCore
        common={commonOf(props)}
        handle={ref as Ref<Contract.GroupedVirtuosoHandle>}
        count={count}
        rowOf={(location) =>
          "index" in location ? rowOfIndex(count, location.index) : undefined
        }
        rowKey={(index) =>
          computeItemKey ? computeItemKey(index, data?.[index], context) : index
        }
        renderRow={(index) => {
          const cells = itemContent?.(index, data?.[index], context);
          return TableRow ? (
            <TableRow
              {...itemProps(index, height, data?.[index])}
              context={context}
            >
              {cells}
            </TableRow>
          ) : (
            <AnyView style={{ flexDirection: "row" }}>{cells}</AnyView>
          );
        }}
        Scroller={components?.Scroller}
        EmptyPlaceholder={components?.EmptyPlaceholder}
      />
    </>
  );
  const style = { display: "flex", flexDirection: "column", flex: 1 } as const;
  return Table ? (
    <Table context={context} style={style}>
      {body}
    </Table>
  ) : (
    <AnyView style={style}>{body}</AnyView>
  );
}) as unknown as typeof Contract.TableVirtuoso;
