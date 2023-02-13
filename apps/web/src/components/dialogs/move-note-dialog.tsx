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
import { Box, Button, Flex, Input, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { db } from "../../common/db";
import Dialog from "./dialog";
import Field from "../field";
import { useStore, store } from "../../stores/notebook-store";
import { store as notestore } from "../../stores/note-store";
import { Perform } from "../../common/dialog-controller";
import { showToast } from "../../utils/toast";
import { pluralize } from "../../utils/string";
import { isMac } from "../../utils/platform";
import create from "zustand";
import { usePersistentState } from "../../hooks/use-persistent-state";

type MoveDialogProps = { onClose: Perform; noteIds: string[] };
type NotebookReference = {
  id: string;
  topic: string;
  new: boolean;
  op: "add" | "remove";
};
type Item = {
  id: string;
  type: "topic" | "notebook" | "header";
  title: string;
};
type Topic = Item & { notebookId: string };
type Notebook = Item & { topics: Topic[]; dateCreated: number };

interface ISelectionStore {
  selected: NotebookReference[];
  isMultiselect: boolean;
  setSelected(refs: NotebookReference[]): void;
  setIsMultiselect(state: boolean): void;
}
export const useSelectionStore = create<ISelectionStore>((set) => ({
  selected: [],
  isMultiselect: false,
  setSelected: (selected) => set({ selected }),
  setIsMultiselect: (isMultiselect) => set({ isMultiselect })
}));

function MoveDialog({ onClose, noteIds }: MoveDialogProps) {
  const { selected, setIsMultiselect, isMultiselect, setSelected } =
    useSelectionStore();

  const [suggestion, setSuggestion] = usePersistentState<NotebookReference[]>(
    "link-notebooks:suggestion",
    []
  );

  const refreshNotebooks = useStore((store) => store.refresh);
  const notebooks = useStore((store) => store.notebooks);
  const getAllNotebooks = useCallback(() => {
    refreshNotebooks();
    return (store.get().notebooks as Notebook[]).filter(
      (a) => a.type !== "header"
    );
  }, [refreshNotebooks]);

  useEffect(() => {
    if (!notebooks) return;

    const selected: NotebookReference[] = [];
    for (const notebook of notebooks as Notebook[]) {
      if (notebook.type === "header") continue;
      for (const topic of notebook.topics) {
        if (topicHasNotes(topic, noteIds)) {
          selected.push({
            id: notebook.id,
            topic: topic.id,
            op: "add",
            new: false
          });
        }
      }
    }
    setSelected(selected);
    setIsMultiselect(false);
  }, [noteIds, notebooks, setSelected, setIsMultiselect]);

  return (
    <Dialog
      isOpen={true}
      title={"Select notebooks"}
      description={`Use ${
        isMac() ? "cmd" : "ctrl"
      }+click to select multiple topics`}
      onClose={() => onClose(false)}
      width={450}
      positiveButton={{
        text: "Done",
        disabled: !selected.length,
        onClick: async () => {
          setSuggestion(selected);
          for (const item of selected) {
            try {
              if (item.op === "remove") {
                await db.notes?.removeFromNotebook(item, ...noteIds);
              } else if (item.op === "add") {
                await db.notes?.addToNotebook(item, ...noteIds);
              }
            } catch (e) {
              if (e instanceof Error) showToast("error", e.message);
              console.error(e);
            }
          }

          notestore.refresh();

          const addedTopics = selected.filter((a) => a.op === "add").length;
          const removedTopics = selected.filter(
            (a) => a.op === "remove"
          ).length;

          showToast(
            "success",
            `${pluralize(noteIds.length, "note", "notes")} added to ${pluralize(
              addedTopics,
              "topic",
              "topics"
            )} & removed from ${pluralize(removedTopics, "topic", "topics")}.`
          );

          onClose(true);
        }
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => onClose(false)
      }}
    >
      <Flex
        mt={1}
        sx={{ overflowY: "hidden", flexDirection: "column" }}
        data-test-id="notebook-list"
      >
        {suggestion.length > 0 && selected.length <= 0 && (
          <Flex
            sx={{
              bg: "shade",
              borderRadius: "default",
              p: 1,
              alignItems: "center",
              cursor: "pointer",
              ":hover": {
                filter: "brightness(70%)"
              }
            }}
            onClick={() => setSelected(suggestion.slice())}
          >
            <Icon.Suggestion color="primary" size={16} sx={{ mr: 1 }} />
            <Text variant="body" sx={{ color: "primary" }}>
              {stringifySelected(suggestion)}
            </Text>
          </Flex>
        )}
        <FilteredTree
          placeholders={{
            empty: "Add a new notebook",
            filter: "Search or add a new notebook"
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
          renderItem={(notebook, _index, refresh, isSearching) => (
            <NotebookItem
              notebook={notebook}
              isSearching={isSearching}
              onCreateItem={async (title) => {
                await db.notebooks?.notebook(notebook.id).topics.add(title);
                refresh();
              }}
            />
          )}
        />
      </Flex>
      {isMultiselect && (
        <Button
          variant="anchor"
          onClick={() => {
            setIsMultiselect(false);
            setSelected(
              selected.filter((a) => !a.new).map((s) => ({ ...s, op: "add" }))
            );
          }}
          sx={{ textDecoration: "none", mt: 1 }}
        >
          Reset selection
        </Button>
      )}
    </Dialog>
  );
}

function NotebookItem(props: {
  notebook: Notebook;
  isSearching: boolean;
  onCreateItem: (title: string) => void;
}) {
  const { notebook, isSearching, onCreateItem } = props;

  const { selected, setIsMultiselect, setSelected } = useSelectionStore();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const isSelected = isNotebookSelected(notebook, selected);

  return (
    <Box as="li" data-test-id="notebook">
      <Box
        as="details"
        sx={{
          "&[open] .arrow-up": { display: "block" },
          "&[open] .arrow-down": { display: "none" },
          "&[open] .title": { fontWeight: "bold" },
          "&[open] .create-topic": { display: "block" }
        }}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        open={isSearching}
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
            height: "40px"
          }}
        >
          <Flex
            sx={{ alignItems: "center" }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              setIsMultiselect(true);
              setSelected(
                selectNotebook(notebook, selected, isSelected || false)
              );
            }}
          >
            <SelectedCheck size={20} selected={isSelected} />
            <Text
              className="title"
              data-test-id="notebook-title"
              variant="subtitle"
              sx={{ fontWeight: "body" }}
            >
              {notebook.title}
              <Text variant="subBody" sx={{ fontWeight: "body" }}>
                {" "}
                ({pluralize(notebook.topics.length, "topic", "topics")})
              </Text>
            </Text>
          </Flex>
          <Flex data-test-id="notebook-tools" sx={{ alignItems: "center" }}>
            <Button
              variant="tool"
              className="create-topic"
              data-test-id="create-topic"
              sx={{ display: "none", p: 1, mr: 1 }}
            >
              <Icon.Plus
                size={18}
                title="Add a new topic"
                onClick={() => setIsCreatingNew(true)}
              />
            </Button>
            <Icon.ChevronDown
              className="arrow-down"
              size={20}
              sx={{ height: "20px" }}
            />
            <Icon.ChevronUp
              className="arrow-up"
              size={20}
              sx={{ display: "none", height: "20px" }}
            />
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
        >
          {isCreatingNew && (
            <Flex
              as="li"
              sx={{
                alignItems: "center",
                p: "small"
              }}
            >
              <SelectedCheck selected={false} />
              <Input
                variant="clean"
                data-test-id={`new-topic-input`}
                autoFocus
                sx={{
                  bg: "bgSecondary",
                  p: "small",
                  border: "1px solid var(--border)"
                }}
                onBlur={() => setIsCreatingNew(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsCreatingNew(false);
                    onCreateItem(e.currentTarget.value);
                  } else if (e.key === "Escape") {
                    setIsCreatingNew(false);
                  }
                }}
              />
            </Flex>
          )}
          {notebook.topics.map((topic) => (
            <TopicItem key={topic.id} topic={topic} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function TopicItem(props: { topic: Topic }) {
  const { topic } = props;

  const { selected, setIsMultiselect, setSelected, isMultiselect } =
    useSelectionStore();

  const index = findSelectionIndex(topic, selected);
  const selectedTopic = selected[index];

  return (
    <Flex
      as="li"
      key={topic.id}
      data-test-id="topic"
      sx={{
        alignItems: "center",
        p: "small",
        borderRadius: "default",
        cursor: "pointer",
        ":hover": { bg: "hover" }
      }}
      onClick={(e) => {
        const isCtrlPressed = e.ctrlKey || e.metaKey;
        if (isCtrlPressed) setIsMultiselect(true);

        if (isMultiselect || isCtrlPressed) {
          setSelected(selectMultipleTopics(topic, selected));
        } else {
          setSelected(selectSingleTopic(topic, selected));
        }
      }}
    >
      <SelectedCheck
        selected={
          selectedTopic?.op === "remove"
            ? "remove"
            : selectedTopic?.op === "add"
        }
      />
      <Text variant="body" sx={{ fontSize: "subtitle" }}>
        {topic.title}
      </Text>
    </Flex>
  );
}

export default MoveDialog;

type FilteredTreeProps<T extends Item> = {
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

function FilteredTree<T extends Item>(props: FilteredTreeProps<T>) {
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
        {items.map((item, index) => renderItem(item, index, refresh, !!query))}
      </Flex>
    </>
  );
}

function SelectedCheck({
  selected,
  size = 20
}: {
  selected: boolean | null | "remove";
  size?: number;
}) {
  return selected === true ? (
    <Icon.CheckCircleOutline size={size} sx={{ mr: 1 }} color="primary" />
  ) : selected === null ? (
    <Icon.CheckIntermediate size={size} sx={{ mr: 1 }} color="dimPrimary" />
  ) : selected === "remove" ? (
    <Icon.CheckRemove size={size} sx={{ mr: 1 }} color="error" />
  ) : (
    <Icon.CircleEmpty size={size} sx={{ mr: 1, opacity: 0.4 }} />
  );
}

function createSelection(topic: Topic): NotebookReference {
  return {
    id: topic.notebookId,
    topic: topic.id,
    op: "add",
    new: true
  };
}

function findSelectionIndex(
  topic: Topic | NotebookReference,
  array: NotebookReference[]
) {
  return "op" in topic
    ? array.findIndex((a) => a.id === topic.id && a.topic === topic.topic)
    : array.findIndex((a) => a.id === topic.notebookId && a.topic === topic.id);
}

function topicHasNotes(topic: Item, noteIds: string[]) {
  const notes: string[] = db.notes?.topicReferences.get(topic.id) || [];
  return noteIds.some((id) => notes.indexOf(id) > -1);
}

// There are 3 cases:
// 1. Click on a notebook to select/deselect all its topics
// 2. Click on a topic to select/deselect it (and deselect all other topics)
// 3. Ctrl+click on a topic to enter multi select

function selectNotebook(
  notebook: Notebook,
  selected: NotebookReference[],
  isNotebookSelected: boolean
) {
  for (const topic of notebook.topics) {
    const index = findSelectionIndex(topic, selected);
    const item = selected[index];

    // 1. first reset the item's selection state
    // 2. set the new state

    if (item?.new) selected.splice(index, 1);
    else if (item && !item.new) item.op = "remove";

    if (!isNotebookSelected) {
      if (!item || item.new) selected.push(createSelection(topic));
      else if (item && !item.new) item.op = "add";
    }
  }

  return selected;
}

function selectMultipleTopics(topic: Topic, selected: NotebookReference[]) {
  const index = findSelectionIndex(topic, selected);
  const isSelected = index > -1;
  const item = selected[index];

  if (isSelected) {
    // we remove new topics & toggle old ones
    if (item.new) selected.splice(index, 1);
    else item.op = item.op === "add" ? "remove" : "add";
  } else {
    selected.push(createSelection(topic));
  }

  return selected;
}

function selectSingleTopic(topic: Topic, array: NotebookReference[]) {
  const selected: NotebookReference[] = array.filter((ref) => !ref.new);

  const index = findSelectionIndex(topic, array);
  const item = array[index];
  const isSelected = index > -1;

  if (isSelected && !item.new) {
    item.op = item.op === "add" ? "remove" : "add";
  } else if (!isSelected) {
    selected.forEach((a) => (a.op = "remove"));
    selected.push(createSelection(topic));
  }

  return selected;
}

function isNotebookSelected(notebook: Notebook, selected: NotebookReference[]) {
  const selectedTopics = notebook.topics.filter((topic) => {
    const index = findSelectionIndex(topic, selected);
    return selected[index]?.op === "add";
  });

  return !selectedTopics.length
    ? false
    : selectedTopics.length === notebook.topics.length
    ? true
    : null;
}

function stringifySelected(suggestion: NotebookReference[]) {
  const added = suggestion
    .filter((a) => a.op === "add")
    .map(resolve)
    .filter(Boolean);
  const removed = suggestion
    .filter((a) => a.op === "remove")
    .map(resolve)
    .filter(Boolean);
  if (!added.length && !removed.length) return;

  const parts = ["Add to"];
  if (added.length >= 1) parts.push(added[0]);
  if (added.length > 1) parts.push(`and ${added.length - 1} others`);

  if (removed.length >= 1) {
    parts.push("remove from");
    parts.push(added[0]);
  }
  if (removed.length > 1) parts.push(`and ${removed.length - 1} others`);

  return parts.join(" ");
}

function resolve(ref: NotebookReference) {
  const topic = db.notebooks?.notebook(ref.id)?.topics.topic(ref.topic);
  if (!topic) return undefined;
  return topic._topic.title;
}
