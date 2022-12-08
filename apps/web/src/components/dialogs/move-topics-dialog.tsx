/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import { Button, Flex, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { db } from "../../common/db";
import Dialog from "./dialog";
import Field from "../field";
import { useStore, store } from "../../stores/notebook-store";
import { Perform } from "../../common/dialog-controller";

type MoveDialogProps = { onClose: Perform; topics: []; id: String };
type Item = {
  id: string;
  type: "notebook" | "header";
  title: string;
};
type Notebook = Item;

function MoveDialog({ onClose, topics, id }: MoveDialogProps) {
  const [selected, setSelected] = useState(String);

  const refreshNotebooks = useStore((store) => store.refresh);
  const getAllNotebooks = useCallback(() => {
    refreshNotebooks();
    return (store.get().notebooks as Notebook[]).filter((a) => {
      return a.type !== "header" && a.id !== id;
    });
  }, [refreshNotebooks]);

  return (
    <Dialog
      isOpen={true}
      title={"Move topic(s)"}
      description={"You can move topics between notebooks"}
      onClose={onClose}
      width={"30%"}
      positiveButton={{
        text: "Finish",
        disabled: !selected.length,
        onClick: async () => {
          await db?.notebooks?.moveTopics(selected, topics);
          onClose(true);
        }
      }}
      negativeButton={{
        text: "Cancel",
        onClick: onClose
      }}
    >
      <Flex
        mt={1}
        sx={{ overflowY: "hidden", flexDirection: "column" }}
        data-test-id="notebook-list"
      >
        <FilteredList
          placeholders={{
            empty: "Add a new notebook",
            filter: "Filter notebooks"
          }}
          items={getAllNotebooks}
          filter={(notebooks, query) =>
            db.lookup?.notebooks(notebooks, query) || []
          }
          onCreateNewItem={async (title) =>
            await db.notebooks?.add({
              title
            })
          }
          renderItem={(notebook, _index, refresh) => {
            return (
              <Flex
                sx={{
                  alignItems: "center",
                  p: "3px",
                  cursor: "pointer",
                  ":hover": { bg: "hover" },
                  justifyContent: "space-between"
                }}
                onClick={(e) => {
                  console.log("143 move topic dialog", notebook);
                  setSelected(notebook.id);
                  refresh();
                }}
              >
                <Flex>
                  {selected === notebook.id ? (
                    <Icon.Checkmark size={18} />
                  ) : (
                    <Icon.ChevronRight size={18} />
                  )}
                  <Text
                    variant={"body"}
                    sx={{ fontSize: "subtitle" }}
                    data-test-id="title"
                  >
                    {notebook.title}
                  </Text>
                </Flex>
              </Flex>
            );
          }}
        />
      </Flex>
    </Dialog>
  );
}

type FilteredListProps<T extends Item> = {
  placeholders: { filter: string; empty: string };
  items: () => T[];
  filter: (items: T[], query: string) => T[];
  onCreateNewItem: (title: string) => Promise<void>;
  renderItem: (item: T, index: number, refresh: () => void) => JSX.Element;
};

function FilteredList<T extends Item>(props: FilteredListProps<T>) {
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
                icon: Icon.Plus,
                onClick: async () => await _createNewItem(query)
              }
            : { icon: Icon.Search, onClick: () => _filter(query) }
        }
      />
      <Flex mt={1} sx={{ overflowY: "hidden", flexDirection: "column" }}>
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
            <Icon.Plus size={16} color="primary" />
          </Button>
        )}
        {items.map((item, index) => renderItem(item, index, refresh))}
      </Flex>
    </>
  );
}
export default MoveDialog;
