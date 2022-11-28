import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button, Flex, Input, Text } from "@theme-ui/components";
import { Icon } from "../icons/icon";
import { Icons } from "../icons";
import { FlexScrollContainer } from "../scroll-container";

type FilteredListT<T> = {
  placeholder: string;
  getAll: () => Array<T>;
  filter: (items: T[], query: string) => T[];
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
    (query) => {
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
    (title) => {
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
      <Input
        sx={{
          mt: 1,
          mb: 1,
          mr: 1,
          fontSize: "body",
          py: "7px",
          color: "text"
        }}
        ref={inputRef}
        autoFocus
        placeholder={items.length <= 0 ? `Add a ${itemName}` : placeholder}
        onChange={(e) => {
          _filter(e.target.value);
        }}
        onKeyUp={async (e) => {
          if (e.key === "Enter" && noItemsFound) {
            _createNewItem(query);
          }
        }}
      />

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
