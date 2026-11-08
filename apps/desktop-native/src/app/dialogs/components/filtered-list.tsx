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

import { useCallback, useState, type ReactNode } from "react";
import { Button, Flex, Text, VirtualList } from "@ui";
import { strings } from "@notesnook/intl";
import { Close, Plus, SearchIcon } from "../../components/icons";
import { Field } from "./field";

type FilteredListProps<T> = {
  placeholders: { filter: string; empty: string; emptyList: string };
  filter: (query: string) => Promise<void>;
  onCreateNewItem: (title: string) => Promise<void>;
  items: ArrayLike<T>;
  estimatedSize: number;
  getItemKey: (index: number) => string;
  renderItem: (props: { index: number }) => ReactNode;
  height?: number;
};

export function FilteredList<T>(props: FilteredListProps<T>) {
  const { items, filter, onCreateNewItem, placeholders } = props;
  const [query, setQuery] = useState<string>();
  const [fieldKey, setFieldKey] = useState(0);
  const noItemsFound = items.length <= 0 && query && query.length > 0;

  const _filter = useCallback(
    async (query = "") => {
      await filter(query);
      setQuery(query);
    },
    [filter]
  );

  const _createNewItem = useCallback(
    async (title: string) => {
      await onCreateNewItem(title);
      setQuery(undefined);
      setFieldKey((k) => k + 1);
    },
    [onCreateNewItem]
  );

  return (
    <Flex sx={{ flexDirection: "column", flex: 1 }}>
      <Field
        key={fieldKey}
        testID="filter-input"
        autoFocus
        sx={{ mb: "spacing7" }}
        styles={{ input: { pl: 30 } }}
        placeholder={
          items.length <= 0 ? placeholders.empty : placeholders.filter
        }
        onChangeText={(text) => _filter(text)}
        onSubmit={async () => {
          if (noItemsFound) await _createNewItem(query);
        }}
        leftIcon={SearchIcon}
        rightActions={[
          {
            icon: Close,
            onPress: () => {
              setFieldKey((k) => k + 1);
              _filter("");
            },
            hidden: !query
          }
        ]}
      />

      {items.length <= 0 && !query && (
        <Flex
          sx={{
            justifyContent: "center",
            alignItems: "center",
            height: 180
          }}
        >
          <Text sx={{ color: "paragraph-secondary", fontSize: "sm" }}>
            {placeholders.emptyList}
          </Text>
        </Flex>
      )}

      {noItemsFound ? (
        <Button
          variant="secondary"
          sx={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            p: "spacing4",
            minWidth: 0
          }}
          onPress={async () => {
            await _createNewItem(query);
          }}
        >
          <Text
            numberOfLines={1}
            sx={{ color: "paragraph", fontSize: "sm", minWidth: 0 }}
          >{`${strings.add()} "${query}"`}</Text>
          <Plus size={15} color="icon" />
        </Button>
      ) : (
        <VirtualList
          count={items.length}
          itemKey={props.getItemKey}
          estimatedItemSize={props.estimatedSize}
          renderItem={(index) => props.renderItem({ index })}
          sx={{ height: props.height ?? 280 }}
        />
      )}
    </Flex>
  );
}
