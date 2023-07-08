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

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Field from "../field";
import { Plus, Search } from "../icons";
import { Button, Flex, Text } from "@theme-ui/components";

type FilterableItem = {
  id: string;
  title: string;
};

type FilteredListProps<T extends FilterableItem> = {
  placeholders: { filter: string; empty: string };
  items: () => T[];
  filter: (items: T[], query: string) => T[];
  onCreateNewItem: (title: string) => Promise<void>;
  renderItem: (
    item: T,
    index: number,
    refresh: () => void,
    isSearching: boolean
  ) => JSX.Element;
};

export function FilteredList<T extends FilterableItem>(
  props: FilteredListProps<T>
) {
  const {
    items: _items,
    filter,
    onCreateNewItem,
    placeholders,
    renderItem
  } = props;

  const [items, setItems] = useState<T[]>([]);
  const [query, setQuery] = useState<string>();
  const noItemsFound = items.length <= 0 && query && query.length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setItems(_items());
  }, [_items]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const _filter = useCallback(
    (query) => {
      setItems(() => {
        const items = _items();
        if (!query) {
          return items;
        }
        return filter(items, query);
      });
      setQuery(query);
    },
    [_items, filter]
  );

  const _createNewItem = useCallback(
    async (title) => {
      await onCreateNewItem(title);
      refresh();
      setQuery(undefined);
      if (inputRef.current) inputRef.current.value = "";
    },
    [inputRef, refresh, onCreateNewItem]
  );

  return (
    <>
      <Field
        inputRef={inputRef}
        data-test-id={"filter-input"}
        autoFocus
        placeholder={
          items.length <= 0 ? placeholders.empty : placeholders.filter
        }
        onChange={(e: ChangeEvent) =>
          _filter((e.target as HTMLInputElement).value)
        }
        onKeyUp={async (e: KeyboardEvent) => {
          if (e.key === "Enter" && noItemsFound) {
            await _createNewItem(query);
          }
        }}
        action={
          items.length <= 0
            ? {
                icon: Plus,
                onClick: async () => await _createNewItem(query)
              }
            : { icon: Search, onClick: () => _filter(query) }
        }
      />
      <Flex
        as="ul"
        mt={1}
        sx={{
          overflowY: "hidden",
          listStyle: "none",
          m: 0,
          p: 0,
          gap: 1,
          display: "flex",
          flexDirection: "column"
        }}
      >
        {noItemsFound && (
          <Button
            variant={"secondary"}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 2
            }}
            onClick={async () => {
              await _createNewItem(query);
            }}
          >
            <Text variant={"body"}>{`Add "${query}"`}</Text>
            <Plus size={16} color="primary" />
          </Button>
        )}
        {items.map((item, index) => renderItem(item, index, refresh, !!query))}
      </Flex>
    </>
  );
}
