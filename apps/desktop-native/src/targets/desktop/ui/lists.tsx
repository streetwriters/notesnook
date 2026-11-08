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
  useRef
} from "react";
import { View } from "react-native";
import type * as Contract from "../../../ui/lists";
import { Flex } from "./primitives";
import { key as keyEvent, useStyled } from "./style/use-styled";

const AnyView = View as any;

export const VirtualList = forwardRef<
  Contract.VirtualListHandle,
  Contract.VirtualListProps
>(function VirtualList(props, ref) {
  const { count, renderItem, itemKey, estimatedItemSize, header, overscan } =
    props;
  const list = useRef<LegendListRef>(null);
  const { viewStyle, nativeProps } = useStyled(
    { sx: props.sx, testID: props.testID },
    { defaults: { display: "flex", flexDirection: "column", flex: 1 } }
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: ({ index, align = "start", animated = false }) => {
        list.current?.scrollToIndex({
          index,
          animated,
          viewPosition: align === "start" ? 0 : align === "center" ? 0.5 : 1
        });
      }
    }),
    []
  );

  const data = useMemo(
    () => Array.from({ length: count }, (_, index) => index),
    [count]
  );
  const keyExtractor = useCallback(
    (index: number) => itemKey(index),
    [itemKey]
  );
  const render = useCallback(
    ({ item }: { item: number }) => renderItem(item),
    [renderItem]
  );

  return (
    <AnyView
      {...nativeProps}
      style={viewStyle}
      focusable
      onKeyDown={
        props.onKeyDown
          ? (event: any) => props.onKeyDown?.(keyEvent(event))
          : undefined
      }
      onBlur={props.onBlur}
    >
      <LegendList
        ref={list}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={render}
        estimatedItemSize={estimatedItemSize}
        extraData={props.extraData}
        drawDistance={overscan}
        initialScrollIndex={props.initialScrollIndex}
        ListHeaderComponent={header ? <Flex>{header}</Flex> : undefined}
        recycleItems={false}
        style={{ flex: 1 }}
      />
    </AnyView>
  );
});
