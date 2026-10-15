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

import { useCallback, useRef, useState } from "react";
import Field from "../field";
import { Close, Plus, SearchIcon } from "../icons";
import { Button, Text } from "@theme-ui/components";
import { VirtualizedList, VirtualizedListProps } from "../virtualized-list";
import { strings } from "@notesnook/intl";
import { Box } from "@notesnook/ui";
import { useThemeUI } from "@theme-ui/core";

type FilteredListProps<T> = {
  placeholders: { filter: string; empty: string; emptyList: string };
  filter: (query: string) => Promise<void>;
  onCreateNewItem: (title: string) => Promise<void>;
} & VirtualizedListProps<T, unknown>;

export function FilteredList<T>(props: FilteredListProps<T>) {
  const { items, filter, onCreateNewItem, placeholders, ...listProps } = props;
  const { theme } = useThemeUI();
  const itemGap = listProps.itemGap || (theme as any).space?.spacing1;
  const [query, setQuery] = useState<string>();
  const noItemsFound = items.length <= 0 && query && query.length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (inputRef.current) inputRef.current.value = "";
    },
    [inputRef, onCreateNewItem]
  );

  return (
    <>
      <Field
        inputRef={inputRef}
        data-test-id={"filter-input"}
        autoFocus
        sx={{
          mb: "spacing7",
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
        onChange={(e) => _filter((e.target as HTMLInputElement).value)}
        onKeyUp={async (e) => {
          if (e.key === "Enter" && noItemsFound) {
            await _createNewItem(query);
          }
        }}
        leftIcon={SearchIcon}
        rightActions={[
          {
            icon: Close,
            onClick: () => {
              if (inputRef.current) inputRef.current.value = "";
              _filter("");
            },
            hidden: !query
          }
        ]}
      />

      {items.length <= 0 && !query && (
        <Text
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "180px",
            color: "paragraph-secondary",
            fontSize: "sm"
          }}
        >
          {placeholders.emptyList}
        </Text>
      )}

      {noItemsFound ? (
        <Button
          variant={"secondary"}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            p: "spacing4"
          }}
          onClick={async () => {
            await _createNewItem(query);
          }}
        >
          <Text
            sx={{
              color: "paragraph",
              fontSize: "sm"
            }}
          >{`${strings.add()} "${query}"`}</Text>
          <Plus size={15} color="icon" />
        </Button>
      ) : (
        <VirtualizedList {...listProps} items={items} itemGap={itemGap} />
      )}
    </>
  );
}
