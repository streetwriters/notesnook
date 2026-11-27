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
  useImperativeHandle,
  useRef,
  type ReactNode
} from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import type * as Contract from "../contracts/lists";
import { Flex } from "./primitives";

// The kit's lists on the web are react-virtuoso's own components.
export { Virtuoso, GroupedVirtuoso, TableVirtuoso } from "react-virtuoso";

const DEFAULT_OVERSCAN = 200;

function Header(props: { context?: { header?: ReactNode } }) {
  return <>{props.context?.header}</>;
}

const COMPONENTS = { Header };
const NO_COMPONENTS = {};

/** @deprecated The old list API, mapped onto `Virtuoso`. Use `Virtuoso`. */
export const VirtualList = forwardRef<
  Contract.VirtualListHandle,
  Contract.VirtualListProps
>(function VirtualList(props, ref) {
  const { count, renderItem, itemKey, header } = props;
  const list = useRef<VirtuosoHandle>(null);
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: ({ index, align, animated }) =>
        list.current?.scrollToIndex({
          index,
          align,
          behavior: animated ? "smooth" : "auto"
        })
    }),
    []
  );
  return (
    <Flex
      data-test-id={props.testID}
      sx={{ flex: 1, flexDirection: "column", overflow: "hidden", ...props.sx }}
    >
      <Virtuoso
        ref={list}
        style={{ flex: 1, outline: "none" }}
        tabIndex={0}
        totalCount={count}
        context={{ header, extraData: props.extraData }}
        components={header ? COMPONENTS : NO_COMPONENTS}
        itemContent={(index) => renderItem(index)}
        computeItemKey={(index) => itemKey(index)}
        defaultItemHeight={props.estimatedItemSize}
        increaseViewportBy={props.overscan ?? DEFAULT_OVERSCAN}
        initialTopMostItemIndex={props.initialScrollIndex ?? 0}
        onKeyDown={props.onKeyDown as never}
        onBlur={() => props.onBlur?.()}
      />
    </Flex>
  );
});
