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

import { useCallback, useState } from "react";
import { strings } from "@notesnook/intl";
import { Button, Text } from "@ui";
import Field from "../field";
import { Close, Plus, SearchIcon } from "../icons";
import {
  VirtualizedList,
  type VirtualizedListProps
} from "../virtualized-list";

type FilteredListProps<T> = {
  placeholders: { filter: string; empty: string; emptyList: string };
  filter: (query: string) => Promise<void>;
  onCreateNewItem: (title: string) => Promise<void>;
} & VirtualizedListProps<T, unknown>;

export function FilteredList<T>(props: FilteredListProps<T>) {
  const { items, filter, onCreateNewItem, placeholders, ...listProps } = props;
  const itemGap = listProps.itemGap ?? 7;
  const [query, setQuery] = useState<string>();
  const [text, setText] = useState("");
  const noItemsFound = items.length <= 0 && query && query.length > 0;

  const _filter = useCallback(
    async (query = "") => {
      setText(query);
      await filter(query);
      setQuery(query);
    },
    [filter]
  );

  const _createNewItem = useCallback(
    async (title: string) => {
      await onCreateNewItem(title);
      setQuery(undefined);
      setText("");
    },
    [onCreateNewItem]
  );

  return (
    <>
      <Field
        testID="filter-input"
        autoFocus
        value={text}
        sx={{ mb: "spacing7" }}
        styles={{
          input: {
            pl: "spacing10",
            py: "spacing6",
            pr: "spacing4",
            fontSize: "sm"
          }
        }}
        placeholder={
          items.length <= 0 ? placeholders.empty : placeholders.filter
        }
        onChangeText={(value) => _filter(value)}
        onKeyUp={async (e) => {
          if (e.key === "Enter" && noItemsFound && query) {
            await _createNewItem(query);
          }
        }}
        leftIcon={SearchIcon}
        rightActions={[
          {
            icon: Close,
            onClick: () => _filter(""),
            hidden: !query
          }
        ]}
      />

      {items.length <= 0 && !query && (
        <Text
          sx={{
            height: 180,
            textAlign: "center",
            color: "paragraph-secondary",
            fontSize: "sm"
          }}
        >
          {placeholders.emptyList}
        </Text>
      )}

      {noItemsFound && query ? (
        <Button
          variant="secondary"
          onPress={async () => {
            await _createNewItem(query);
          }}
          sx={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            p: "spacing4",
            minWidth: 0
          }}
        >
          <Text
            numberOfLines={1}
            sx={{ color: "paragraph", fontSize: "sm", minWidth: 0 }}
          >{`${strings.add()} "${query}"`}</Text>
          <Plus size={15} color="icon" />
        </Button>
      ) : (
        <VirtualizedList {...listProps} items={items} itemGap={itemGap} />
      )}
    </>
  );
}
