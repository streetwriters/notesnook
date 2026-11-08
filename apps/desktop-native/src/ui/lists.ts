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
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes
} from "react";
import type { KeyEvent } from "./events";
import type { SxProp } from "./style";

export interface ScrollToIndexOptions {
  index: number;
  align?: "start" | "center" | "end";
  animated?: boolean;
}

export interface VirtualListHandle {
  scrollToIndex(options: ScrollToIndexOptions): void;
}

export interface VirtualListProps {
  count: number;
  renderItem: (index: number) => ReactNode;
  itemKey: (index: number) => string;
  estimatedItemSize: number;
  extraData?: unknown;
  header?: ReactNode;
  overscan?: number;
  initialScrollIndex?: number;
  onKeyDown?: (event: KeyEvent) => void;
  onBlur?: () => void;
  sx?: SxProp;
  testID?: string;
}

export declare const VirtualList: ForwardRefExoticComponent<
  VirtualListProps & RefAttributes<VirtualListHandle>
>;
