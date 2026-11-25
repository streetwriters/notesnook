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

import type {
  ComponentType,
  ForwardRefExoticComponent,
  Key,
  ReactElement,
  ReactNode,
  Ref,
  RefAttributes
} from "react";
import type { UIElement } from "./elements";
import type { UIFocusEvent, UIKeyboardEvent } from "./events";
import type { DataAttributes } from "./primitives";
import type { StyleProp, SxProp } from "./style";

export interface LocationOptions {
  align?: "start" | "center" | "end";
  behavior?: "auto" | "smooth";
  offset?: number;
}

export interface FlatIndexLocationWithAlign extends LocationOptions {
  index: number | "LAST";
}

export interface GroupIndexLocationWithAlign extends LocationOptions {
  groupIndex: number;
}

export type IndexLocationWithAlign =
  | FlatIndexLocationWithAlign
  | GroupIndexLocationWithAlign;

export interface CalculateViewLocationParams {
  itemTop: number;
  itemBottom: number;
  viewportTop: number;
  viewportBottom: number;
  locationParams: {
    align?: "start" | "center" | "end";
    behavior?: "auto" | "smooth";
  } & ({ index: number } | { groupIndex: number });
}

export type CalculateViewLocation = (
  params: CalculateViewLocationParams
) => IndexLocationWithAlign | number | null;

export interface ScrollIntoViewLocationOptions {
  align?: "start" | "center" | "end";
  behavior?: "auto" | "smooth";
  calculateViewLocation?: CalculateViewLocation;
  done?: () => void;
}

export interface FlatScrollIntoViewLocation
  extends ScrollIntoViewLocationOptions {
  index: number;
}

export interface GroupedScrollIntoViewLocation
  extends ScrollIntoViewLocationOptions {
  groupIndex: number;
}

export type ScrollIntoViewLocation =
  | FlatScrollIntoViewLocation
  | GroupedScrollIntoViewLocation;

export interface VirtuosoHandle {
  scrollToIndex(location: number | FlatIndexLocationWithAlign): void;
  scrollIntoView(location: FlatScrollIntoViewLocation): void;
  scrollTo(location: { top?: number; behavior?: "auto" | "smooth" }): void;
  scrollBy(location: { top?: number; behavior?: "auto" | "smooth" }): void;
}

export interface GroupedVirtuosoHandle {
  scrollToIndex(location: number | IndexLocationWithAlign): void;
  scrollIntoView(location: number | ScrollIntoViewLocation): void;
  scrollTo(location: { top?: number; behavior?: "auto" | "smooth" }): void;
  scrollBy(location: { top?: number; behavior?: "auto" | "smooth" }): void;
}

export type TableVirtuosoHandle = VirtuosoHandle;

export interface ContextProp<C> {
  context: C;
}

export type ItemProps<D> = {
  children?: ReactNode;
  style?: StyleProp;
  "data-index": number;
  "data-item-index": number;
  "data-item-group-index"?: number;
  "data-known-size": number;
  item: D;
};

export type ScrollerProps = {
  children?: ReactNode;
  style?: StyleProp;
  tabIndex?: number;
  "data-testid"?: string;
  "data-virtuoso-scroller"?: boolean;
} & RefAttributes<UIElement>;

export type TopItemListProps = {
  children?: ReactNode;
  style?: StyleProp;
};

export type TableProps = {
  children?: ReactNode;
  style?: StyleProp;
};

export type TableRowProps<D> = ItemProps<D>;

export interface Components<Data = unknown, Context = unknown> {
  EmptyPlaceholder?: ComponentType<ContextProp<Context>>;
  Footer?: ComponentType<ContextProp<Context>>;
  Header?: ComponentType<ContextProp<Context>>;
  Item?: ComponentType<ItemProps<Data> & ContextProp<Context>>;
  Scroller?: ComponentType<ScrollerProps & ContextProp<Context>>;
  TopItemList?: ComponentType<TopItemListProps & ContextProp<Context>>;
}

export interface TableComponents<Data = unknown, Context = unknown> {
  EmptyPlaceholder?: ComponentType<ContextProp<Context>>;
  Scroller?: ComponentType<ScrollerProps & ContextProp<Context>>;
  Table?: ComponentType<TableProps & ContextProp<Context>>;
  TableRow?: ComponentType<TableRowProps<Data> & ContextProp<Context>>;
}

export type ItemContent<D, C> = (
  index: number,
  data: D,
  context: C
) => ReactNode;

export type GroupItemContent<D, C> = (
  index: number,
  groupIndex: number,
  data: D,
  context: C
) => ReactNode;

export type GroupContent<C> = (index: number, context: C) => ReactNode;

export type ComputeItemKey<D, C> = (index: number, item: D, context: C) => Key;

export type FixedHeaderContent = (() => ReactNode) | null;

export interface VirtuosoProps<D, C> extends DataAttributes {
  data?: readonly D[];
  totalCount?: number;
  itemContent?: ItemContent<D, C>;
  computeItemKey?: ComputeItemKey<D, C>;
  context?: C;
  components?: Components<D, C>;
  defaultItemHeight?: number;
  fixedItemHeight?: number;
  increaseViewportBy?: number | { top: number; bottom: number };
  initialTopMostItemIndex?: number | IndexLocationWithAlign;
  customScrollParent?: UIElement;
  id?: string;
  className?: string;
  style?: StyleProp;
  tabIndex?: number;
  onKeyDown?: (event: UIKeyboardEvent) => void;
  onBlur?: (event: UIFocusEvent) => void;
}

export interface GroupedVirtuosoProps<D, C>
  extends Omit<VirtuosoProps<D, C>, "itemContent" | "totalCount"> {
  groupCounts?: number[];
  groupContent?: GroupContent<C>;
  itemContent?: GroupItemContent<D, C>;
}

export interface TableVirtuosoProps<D, C>
  extends Omit<VirtuosoProps<D, C>, "components"> {
  components?: TableComponents<D, C>;
  fixedHeaderContent?: FixedHeaderContent;
}

export declare const Virtuoso: <ItemData = any, Context = any>(
  props: VirtuosoProps<ItemData, Context> & { ref?: Ref<VirtuosoHandle> }
) => ReactElement;

export declare const GroupedVirtuoso: <ItemData = any, Context = any>(
  props: GroupedVirtuosoProps<ItemData, Context> & {
    ref?: Ref<GroupedVirtuosoHandle>;
  }
) => ReactElement;

export declare const TableVirtuoso: <ItemData = any, Context = any>(
  props: TableVirtuosoProps<ItemData, Context> & {
    ref?: Ref<TableVirtuosoHandle>;
  }
) => ReactElement;

/** @deprecated Use the location argument of `VirtuosoHandle.scrollToIndex`. */
export interface ScrollToIndexOptions {
  index: number;
  align?: "start" | "center" | "end";
  animated?: boolean;
}

/** @deprecated Use `VirtuosoHandle`. */
export interface VirtualListHandle {
  scrollToIndex(options: ScrollToIndexOptions): void;
}

/** @deprecated Use `VirtuosoProps`. */
export interface VirtualListProps {
  count: number;
  renderItem: (index: number) => ReactNode;
  itemKey: (index: number) => string;
  estimatedItemSize: number;
  extraData?: unknown;
  header?: ReactNode;
  overscan?: number;
  initialScrollIndex?: number;
  onKeyDown?: (event: UIKeyboardEvent) => void;
  onBlur?: () => void;
  sx?: SxProp;
  testID?: string;
}

/** @deprecated Use `Virtuoso`. */
export declare const VirtualList: ForwardRefExoticComponent<
  VirtualListProps & RefAttributes<VirtualListHandle>
>;

export interface SortableItem {
  id: string;
  group?: string;
}

export interface SortableMove {
  activeId: string;
  overId: string;
  index: number;
  group?: string;
}

export interface SortableListProps<T extends SortableItem> {
  items: T[];
  renderItem: (
    item: T,
    state: { isDragging: boolean; isOver: boolean }
  ) => ReactNode;
  onMove: (move: SortableMove) => void;
  direction?: "vertical" | "horizontal";
  sx?: SxProp;
  "data-test-id"?: string;
  /** @deprecated Use `data-test-id`. */
  testID?: string;
}

export declare function SortableList<T extends SortableItem>(
  props: SortableListProps<T>
): JSX.Element;
