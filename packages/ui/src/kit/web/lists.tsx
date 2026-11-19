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

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type * as Contract from "../contracts/lists";
import { Flex } from "./primitives";
import { isEscapeForOpenMenu } from "./use-dom";

export const VirtualList = forwardRef<
  Contract.VirtualListHandle,
  Contract.VirtualListProps
>(function VirtualList(props, ref) {
  const { count, renderItem, itemKey, estimatedItemSize, header } = props;
  const container = useRef<HTMLDivElement>(null);

  const scrollToIndex = ({
    index,
    align = "start"
  }: Contract.ScrollToIndexOptions) => {
    const item = container.current?.querySelector<HTMLElement>(
      `[data-index="${index}"]`
    );
    item?.scrollIntoView({
      block: align === "start" ? "start" : align === "end" ? "end" : "center"
    });
  };
  useImperativeHandle(ref, () => ({ scrollToIndex }), []);

  const initial = props.initialScrollIndex;
  useEffect(() => {
    if (initial) scrollToIndex({ index: initial });
  }, [initial]);

  const items: JSX.Element[] = [];
  for (let index = 0; index < count; index++)
    items.push(
      <div
        key={itemKey(index)}
        data-index={index}
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: `auto ${estimatedItemSize}px`,
          flexShrink: 0
        }}
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
        {header ? <Flex>{header}</Flex> : null}
        {items}
      </div>
    </Flex>
  );
});
