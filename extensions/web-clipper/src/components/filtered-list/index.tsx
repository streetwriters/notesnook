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
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Flex, Input, Text } from "@theme-ui/components";
import { Icon } from "../icons/icon";
import { Icons } from "../icons";
import { FlexScrollContainer } from "../scroll-container";

type FilteredListT<T> = {
  placeholder: string;
  getAll: () => Array<T>;
  filter?: (items: T[], query: string) => T[];
  onCreateNewItem?: (title: string) => void;
  renderItem: (item: T, index: number) => JSX.Element;
  itemName: string;
  refreshItems: () => T[];
};

export function FilteredList<T>({
  placeholder,
  getAll,
  filter,
  onCreateNewItem,
  renderItem,
  refreshItems,
  itemName
}: FilteredListT<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [query, setQuery] = useState<string | null>("");
  const noItemsFound = items.length <= 0 && !!query?.length;
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    refreshItems();
    setItems(getAll());
  }, [refreshItems, getAll]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const _filter = useCallback(
    (query: string) => {
      if (!filter) return;
      setItems(() => {
        const items = getAll();
        if (!query) {
          return items;
        }
        return filter(items, query);
      });
      setQuery(query);
    },
    [getAll, filter]
  );

  const _createNewItem = useCallback(
    (title: string) => {
      onCreateNewItem?.(title);
      refresh();
      setQuery(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [inputRef, refresh, onCreateNewItem]
  );

  return (
    <>
      {(onCreateNewItem || filter) && (
        <Input
          sx={{
            m: 1,
            width: "auto",
            fontSize: "body",
            py: "7px",
            color: "paragraph"
          }}
          ref={inputRef}
          autoFocus
          placeholder={
            items.length <= 0 && onCreateNewItem
              ? `Add a ${itemName}`
              : placeholder
          }
          onChange={(e) => {
            _filter(e.target.value);
          }}
          onKeyUp={async (e) => {
            if (e.key === "Enter" && noItemsFound && onCreateNewItem) {
              _createNewItem(query);
            }
          }}
        />
      )}

      <FlexScrollContainer>
        <Flex
          sx={{
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          {noItemsFound && onCreateNewItem && (
            <Button
              variant="icon"
              sx={{ display: "flex", alignItems: "center" }}
              onClick={async () => {
                await _createNewItem(query);
              }}
            >
              <Icon path={Icons.plus} color="icon" size={18} />
              <Text
                variant={"body"}
                sx={{ ml: 1 }}
              >{`Add "${query}" ${itemName}`}</Text>
            </Button>
          )}
          {items.map(renderItem)}
        </Flex>
      </FlexScrollContainer>
    </>
  );
}
