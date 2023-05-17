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
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  SetStateAction,
  Dispatch
} from "react";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { db } from "../../common/db";
import Dialog from "./dialog";
import Field from "../field";
import { useStore } from "../../stores/tag-store";
import { Perform } from "../../common/dialog-controller";

/**
 * We can apply the tag/untag state without it being actually applied to the note (instantly)
 * Or we can wait for the stores to update the value
 * remove library collection history from tags
 *
 * make tags static i.e one value in the initial startup
 * make tags updateable with setState
 */

export type AddTagsDialogProps<TCheckId extends string> = {
  onClose: Perform<false | Record<TCheckId, boolean>>;
  items: Array<any>;
};

function AddTagsDialog<TCheckId extends string>(
  props: AddTagsDialogProps<TCheckId>
) {
  const { onClose, items } = props;

  const refreshTags = useStore((store) => store.refresh);
  const allTags = useStore((store) => store.tags);

  useEffect(() => {
    refreshTags();
  }, [refreshTags]);

  const [selectedTags, setSelectedTags] = useState(getTags(allTags, items));
  const _unselectedTags = useMemo(() => {
    return (
      db.tags?.all.filter((t) =>
        selectedTags.every((tag) => tag?.title !== t?.title)
      ) || []
    );
  }, [selectedTags]);
  const [unselectedTags, setUnselectedTags] = useState(_unselectedTags);

  const addTag = async (tag: string) => {
    let tagged = false;
    for (const _tag of selectedTags) {
      if (_tag.title === tag) tagged = true;
    }

    items.forEach(async (item) => {
      if (tagged) await db.notes?.note(item.id).untag(tag);
      else await db.notes?.note(item.id).tag(tag);
    });
  };

  return (
    <Dialog
      isOpen={true}
      title={"Add tags"}
      description={`Add tags to multiple notes at once`}
      onClose={() => onClose(false)}
      width={450}
      positiveButton={{
        text: "Done",
        onClick: async () => {
          onClose(false);
        }
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => onClose(false)
      }}
    >
      {items.length > 1 && (
        <Button
          variant="anchor"
          onClick={() => {}}
          sx={{ textDecoration: "none", mt: 1 }}
        >
          Reset selection
        </Button>
      )}
      <Flex
        mt={1}
        sx={{ overflowY: "hidden", flexDirection: "column" }}
        data-test-id="tag-list"
      >
        <FilteredTree
          placeholders={{
            empty: "Add a new tag",
            filter: "Search or add a new tag"
          }}
          unselectedItems={unselectedTags}
          selectedItems={selectedTags}
          filter={(tags, query) => db.lookup?.tags(tags, query) || []}
          onCreateNewItem={async (title) => {
            await addTag(title);
            setSelectedTags((tags) => {
              return [...tags, { title }];
            });
          }}
          renderItem={(tag, _index, refresh, selected) => (
            <TagItem
              key={tag}
              tag={tag}
              selected={selected}
              addTag={addTag}
              setSelectedTags={setSelectedTags}
              setUnselectedTags={setUnselectedTags}
            />
          )}
        />
      </Flex>
    </Dialog>
  );
}

function TagItem(props: {
  tag: any;
  selected?: boolean | string;
  addTag: (tag: string) => Promise<void>;
  setSelectedTags: Dispatch<SetStateAction<any[]>>;
  setUnselectedTags: Dispatch<SetStateAction<any[]>>;
}) {
  const { tag, selected, addTag, setSelectedTags, setUnselectedTags } = props;

  if (tag.title === "librarycollectionshistory") return null;

  return (
    <Box as="li" data-test-id="tag">
      <Box
        as="details"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await addTag(tag.title);
          setSelectedTags((tags) => {
            if (selected)
              return tags.filter((_tag) => _tag.title !== tag.title);
            else return [...tags, tag];
          });
          setUnselectedTags((tags) => {
            if (selected) return [...tags, tag];
            else return tags.filter((_tag) => _tag.title !== tag.title);
          });
        }}
      >
        <Flex
          as="summary"
          sx={{
            cursor: "pointer",
            justifyContent: "space-between",
            alignItems: "center",
            bg: "bgSecondary",
            borderRadius: "default",
            p: 1,
            height: "40px",
            background: selected ? "shade" : "bgSecondary"
          }}
        >
          <Flex sx={{ alignItems: "center" }}>
            <SelectedCheck size={20} selected={selected} />
            <Text
              className="title"
              data-test-id="notebook-title"
              variant="subtitle"
              sx={{ fontWeight: "body", color: selected ? "primary" : "text" }}
            >
              {tag.title}
            </Text>
          </Flex>
        </Flex>
        <Box
          as="ul"
          sx={{
            listStyle: "none",
            pl: 4,
            mt: 1,
            gap: "2px",
            display: "flex",
            flexDirection: "column"
          }}
        ></Box>
      </Box>
    </Box>
  );
}

export default AddTagsDialog;

type FilteredTreeProps<T> = {
  placeholders: { filter: string; empty: string };
  unselectedItems: Array<any>;
  selectedItems: Array<any>;
  filter: (items: T[], query: string) => T[];
  onCreateNewItem: (title: string) => Promise<void>;
  renderItem: (
    item: string,
    index: number,
    refresh: () => void,
    selected?: boolean | string
  ) => JSX.Element;
};

function FilteredTree<T>(props: FilteredTreeProps<T>) {
  const {
    unselectedItems: _unselectedItems,
    selectedItems: _selectedItems,
    filter,
    onCreateNewItem,
    placeholders,
    renderItem
  } = props;

  const [unselectedItems, setUnselectedItems] = useState<Array<any>>([]);
  const [selectedItems, setSelectedItems] = useState<Array<any>>([]);
  const [query, setQuery] = useState<string>();
  const noItemsFound = unselectedItems.length <= 0 && query && query.length > 0;
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setUnselectedItems(_unselectedItems);
    setSelectedItems(_selectedItems);
    console.log(
      "_unselectedItems",
      _unselectedItems,
      "_selectedItems",
      _selectedItems
    );
  }, [_unselectedItems, _selectedItems]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const _filter = useCallback(
    (query) => {
      setUnselectedItems(() => {
        const items = _unselectedItems;
        if (!query) {
          return items;
        }
        return filter(items, query);
      });
      setSelectedItems(() => {
        const items = _selectedItems;
        if (!query) {
          return items;
        }
        return filter(items, query);
      });
      setQuery(query);
    },
    [_unselectedItems, _selectedItems, filter]
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
          unselectedItems.length + selectedItems.length <= 0
            ? placeholders.empty
            : placeholders.filter
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
          unselectedItems.length + selectedItems.length <= 0
            ? {
                icon: Icon.Plus,
                onClick: async () => await _createNewItem(query)
              }
            : { icon: Icon.Search, onClick: () => _filter(query) }
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
            <Icon.Plus size={16} color="primary" />
          </Button>
        )}
        {selectedItems.map((item, index) =>
          renderItem(item, index, refresh, true)
        )}
        {unselectedItems.map((item, index) => renderItem(item, index, refresh))}
      </Flex>
    </>
  );
}

function SelectedCheck({
  size = 20,
  selected = false
}: {
  size?: number;
  selected?: boolean | string;
}) {
  return selected === true ? (
    <Icon.CheckCircleOutline size={size} sx={{ mr: 1 }} color="primary" />
  ) : (
    <Icon.CircleEmpty size={size} sx={{ mr: 1, opacity: 0.4 }} />
  );
}

function getTags(allTags: Array<any>, items: Array<any>): Array<any> {
  const tags: Array<Array<string>> = [];
  allTags.shift();
  for (const item of items) {
    const noteTags: Array<string> = [];
    for (const tag of allTags) {
      for (const noteId of tag.noteIds) {
        if (item.id === noteId) {
          noteTags.push(tag);
        }
      }
    }
    tags.push(noteTags);
  }
  const result = tags.shift()?.filter(function (_tag: string) {
    return tags.every(function (_tags: Array<string>) {
      return _tags.indexOf(_tag) !== -1;
    });
  });

  if (result) return result;
  else return [];
}
