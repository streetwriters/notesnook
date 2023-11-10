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

import { useCallback, useEffect, useRef } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import {
  Plus,
  ChevronDown,
  Circle,
  CheckCircleOutline,
  CheckIntermediate,
  CheckRemove,
  CircleEmpty,
  ChevronRight
} from "../components/icons";
import { db } from "../common/db";
import Dialog from "../components/dialog";
import { useStore } from "../stores/notebook-store";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { Perform, showAddNotebookDialog } from "../common/dialog-controller";
import { showToast } from "../utils/toast";
import { isMac } from "../utils/platform";
import { create } from "zustand";
import { Notebook, isGroupHeader } from "@notesnook/core/dist/types";
import {
  UncontrolledTreeEnvironment,
  Tree,
  TreeItemIndex
} from "react-complex-tree";
import { FlexScrollContainer } from "../components/scroll-container";
import { pluralize } from "@notesnook/common";

type MoveDialogProps = { onClose: Perform; noteIds: string[] };
type NotebookReference = {
  id: string;
  new: boolean;
  op: "add" | "remove";
};

interface ISelectionStore {
  selected: NotebookReference[];
  isMultiselect: boolean;
  setSelected(refs: NotebookReference[]): void;
  setIsMultiselect(state: boolean): void;
}
export const useSelectionStore = create<ISelectionStore>((set) => ({
  selected: [],
  isMultiselect: false,
  setSelected: (selected) => set({ selected: selected.slice() }),
  setIsMultiselect: (isMultiselect) => set({ isMultiselect })
}));

function MoveDialog({ onClose, noteIds }: MoveDialogProps) {
  const setSelected = useSelectionStore((store) => store.setSelected);
  const setIsMultiselect = useSelectionStore((store) => store.setIsMultiselect);
  const isMultiselect = useSelectionStore((store) => store.isMultiselect);
  const refreshNotebooks = useStore((store) => store.refresh);
  const notebooks = useStore((store) => store.notebooks);
  const reloadItem = useRef<(changedItemIds: TreeItemIndex[]) => void>();

  useEffect(() => {
    if (!notebooks) {
      (async function () {
        await refreshNotebooks();
      })();
      return;
    }

    // for (const notebook of notebooks.ids) {
    //   if (isGroupHeader(notebook)) continue;
    //   // for (const topic of notebook.topics) {
    //   //   const isSelected =
    //   //     selected.findIndex(
    //   //       (item) => item.id === notebook.id && item.topic === topic.id
    //   //     ) > -1;
    //   //   if (!isSelected && topicHasNotes(topic, noteIds)) {
    //   //     selected.push({
    //   //       id: notebook.id,
    //   //       topic: topic.id,
    //   //       op: "add",
    //   //       new: false
    //   //     });
    //   //   }
    //   // }
    // }

    (async function () {
      const selected: NotebookReference[] = useSelectionStore
        .getState()
        .selected.slice();

      for (const { fromId: notebookId } of await db.relations
        .to({ type: "note", ids: noteIds }, "notebook")
        .get()) {
        const isSelected =
          selected.findIndex((item) => item.id === notebookId) > -1;
        if (isSelected) continue;

        if (await notebookHasNotes(notebookId, noteIds)) {
          selected.push({
            id: notebookId,
            op: "add",
            new: false
          });
        }
      }

      setSelected(selected);
      setIsMultiselect(selected.length > 1);
    })();

    // for (const notebook of noteIds
    //   .map((id) => db.relations.to({ id, type: "note" }, "notebook"))
    //   .flat()) {
    // const isSelected =
    //   notebook && selected.findIndex((item) => item.id === notebook.id) > -1;
    // if (!notebook || isSelected) continue;

    // selected.push({
    //   id: notebook.id,
    //   op: "add",
    //   new: false
    // });
    // }
  }, [noteIds, notebooks, refreshNotebooks, setSelected, setIsMultiselect]);

  const _onClose = useCallback(
    (result: boolean) => {
      setSelected([]);
      setIsMultiselect(false);
      onClose(result);
    },
    [setSelected, setIsMultiselect, onClose]
  );

  return (
    <Dialog
      isOpen={true}
      title={"Select notebooks"}
      description={`Use ${
        isMac() ? "cmd" : "ctrl"
      }+click to select multiple topics`}
      onClose={() => _onClose(false)}
      width={450}
      positiveButton={{
        text: "Done",
        onClick: async () => {
          const { selected } = useSelectionStore.getState();
          for (const item of selected) {
            try {
              if (item.op === "remove") {
                await db.notes.removeFromNotebook(item.id, ...noteIds);
              } else if (item.op === "add") {
                await db.notes.addToNotebook(item.id, ...noteIds);
              }
            } catch (e) {
              if (e instanceof Error) showToast("error", e.message);
              console.error(e);
            }
          }

          await noteStore.refresh();
          await notebookStore.refresh();

          const stringified = stringifySelected(selected);
          if (stringified) {
            showToast(
              "success",
              `${pluralize(noteIds.length, "note")} ${stringified}`
            );
          }

          _onClose(true);
        }
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => _onClose(false)
      }}
    >
      {isMultiselect && (
        <Button
          variant="anchor"
          onClick={() => {
            const originalSelection: NotebookReference[] = useSelectionStore
              .getState()
              .selected.filter((a) => !a.new)
              .map((s) => ({ ...s, op: "add" }));
            setSelected(originalSelection);
            setIsMultiselect(originalSelection.length > 1);
          }}
          sx={{ textDecoration: "none", mb: 2 }}
        >
          Reset selection
        </Button>
      )}
      {notebooks && (
        <FlexScrollContainer>
          <UncontrolledTreeEnvironment
            dataProvider={{
              onDidChangeTreeData(listener) {
                reloadItem.current = listener;
                return {
                  dispose() {
                    reloadItem.current = undefined;
                  }
                };
              },
              async getTreeItem(itemId) {
                if (itemId === "root") {
                  return {
                    data: { title: "Root" },
                    index: itemId,
                    isFolder: true,
                    canMove: false,
                    canRename: false,
                    children: notebooks.ids.filter(
                      (t) => !isGroupHeader(t)
                    ) as string[]
                  };
                }

                const notebook = (await db.notebooks.notebook(
                  itemId as string
                ))!;
                const children = await db.relations
                  .from({ type: "notebook", id: itemId as string }, "notebook")
                  .get();
                return {
                  index: itemId,
                  data: notebook,
                  children: children.map((i) => i.toId),
                  isFolder: children.length > 0
                };
              },
              async getTreeItems(itemIds) {
                const records = await db.notebooks.all.records(
                  itemIds as string[],
                  db.settings.getGroupOptions("notebooks")
                );
                const children = await db.relations
                  .from(
                    { type: "notebook", ids: itemIds as string[] },
                    "notebook"
                  )
                  .get();
                console.log(itemIds, notebooks?.ids);
                return itemIds.filter(Boolean).map((id) => {
                  if (id === "root") {
                    return {
                      data: { title: "Root" },
                      index: id,
                      isFolder: true,
                      canMove: false,
                      canRename: false,
                      children: notebooks.ids.filter(
                        (t) => !isGroupHeader(t)
                      ) as string[]
                    };
                  }

                  const notebook = records[id];
                  const subNotebooks = children
                    .filter((r) => r.fromId === id)
                    .map((r) => r.toId);
                  // const totalNotes = allChildren.filter(
                  //   (r) => r.fromId === id && r.toType === "note"
                  // ).length;
                  return {
                    index: id,
                    data: notebook,
                    children: subNotebooks,
                    isFolder: subNotebooks.length > 0
                  };
                });
              }
            }}
            renderItem={(props) => (
              <>
                <NotebookItem
                  notebook={props.item.data as any}
                  depth={props.depth}
                  isExpandable={props.item.isFolder || false}
                  isExpanded={props.context.isExpanded || false}
                  toggle={props.context.toggleExpandedState}
                  onCreateItem={() => reloadItem.current?.([props.item.index])}
                />

                {props.children}
              </>
            )}
            getItemTitle={(item) => item.data.title}
            viewState={{}}
          >
            <Tree treeId={"root"} rootItem="root" treeLabel="Tree Example" />
          </UncontrolledTreeEnvironment>
        </FlexScrollContainer>
      )}
    </Dialog>
  );
}
function calculateIndentation(
  expandable: boolean,
  depth: number,
  base: number
) {
  if (expandable && depth > 0) return depth * 7 + base;
  else if (depth === 0) return 0;
  else return depth * 12 + base;
}
function NotebookItem(props: {
  notebook: Notebook;
  isExpanded: boolean;
  isExpandable: boolean;
  toggle: () => void;
  depth: number;
  onCreateItem: () => void;
}) {
  const { notebook, isExpanded, toggle, depth, isExpandable, onCreateItem } =
    props;

  const setIsMultiselect = useSelectionStore((store) => store.setIsMultiselect);
  const setSelected = useSelectionStore((store) => store.setSelected);
  const isMultiselect = useSelectionStore((store) => store.isMultiselect);

  const check: React.MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      e.stopPropagation();
      e.preventDefault();

      const { selected } = useSelectionStore.getState();

      const isCtrlPressed = e.ctrlKey || e.metaKey;
      if (isCtrlPressed) setIsMultiselect(true);

      if (isMultiselect || isCtrlPressed) {
        setSelected(selectMultiple(notebook, selected));
      } else {
        setSelected(selectSingle(notebook, selected));
      }
    },
    [isMultiselect, notebook, setIsMultiselect, setSelected]
  );

  return (
    <Flex
      as="li"
      data-test-id="notebook"
      // as="summary"
      sx={{
        cursor: "pointer",
        justifyContent: "space-between",
        alignItems: "center",
        bg: depth === 0 ? "var(--background-secondary)" : "transparent",
        borderRadius: "default",
        p: depth === 0 ? 1 : 0,
        height: depth === 0 ? "30px" : "auto",
        ml: `${calculateIndentation(isExpandable, depth, 5)}px`,
        mb: depth === 0 ? 1 : 2
      }}
      onClick={(e) => {
        if (!isExpandable) {
          check(e);
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        toggle();
      }}
    >
      <Flex sx={{ alignItems: "center" }}>
        {isExpandable ? (
          isExpanded ? (
            <ChevronDown size={20} sx={{ height: "20px" }} />
          ) : (
            <ChevronRight size={20} sx={{ height: "20px" }} />
          )
        ) : null}
        <SelectedCheck size={20} item={notebook} onClick={check} />
        <Text
          className="title"
          data-test-id="notebook-title"
          variant="subtitle"
          sx={{ fontWeight: "body" }}
        >
          {notebook.title}
          {/* <Text variant="subBody" sx={{ fontWeight: "body" }}>
                {" "}
                ({pluralize(notebook.topics.length, "topic")})
              </Text> */}
        </Text>
      </Flex>
      <Flex data-test-id="notebook-tools" sx={{ alignItems: "center" }}>
        <TopicSelectionIndicator notebook={notebook} />
        <Button
          variant="secondary"
          data-test-id="create-topic"
          sx={{ p: "small" }}
        >
          <Plus
            size={18}
            title="New notebook"
            onClick={async (e) => {
              e.stopPropagation();
              await showAddNotebookDialog(notebook.id);
              onCreateItem();
            }}
          />
        </Button>
      </Flex>
    </Flex>
  );
}

function TopicSelectionIndicator({ notebook }: { notebook: Notebook }) {
  const hasSelectedTopics = useSelectionStore(
    (store) => store.selected.filter((nb) => nb.id === notebook.id).length > 0
  );

  if (!hasSelectedTopics) return null;
  return <Circle size={8} color="accent" sx={{ mr: 1 }} />;
}

export default MoveDialog;

function SelectedCheck({
  item,
  size = 20,
  onClick
}: {
  item?: Notebook;
  size?: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) {
  const selectedItems = useSelectionStore((store) => store.selected);

  const selectedItem =
    item && selectedItems[findSelectionIndex(item, selectedItems)];
  const selected =
    selectedItem?.op === "remove" ? "remove" : selectedItem?.op === "add";

  return selected === true ? (
    <CheckCircleOutline
      size={size}
      sx={{ mr: 1 }}
      color="accent"
      onClick={onClick}
    />
  ) : selected === null ? (
    <CheckIntermediate
      size={size}
      sx={{ mr: 1 }}
      color="var(--accent-secondary)"
      onClick={onClick}
    />
  ) : selected === "remove" ? (
    <CheckRemove
      size={size}
      sx={{ mr: 1 }}
      color="icon-error"
      onClick={onClick}
    />
  ) : (
    <CircleEmpty size={size} sx={{ mr: 1, opacity: 0.4 }} onClick={onClick} />
  );
}

function createSelection(notebook: Notebook): NotebookReference {
  return {
    id: notebook.id,
    op: "add",
    new: true
  };
}

function findSelectionIndex(
  ref: NotebookReference | Notebook,
  array: NotebookReference[]
) {
  return array.findIndex((a) => a.id === ref.id);
}

function notebookHasNotes(notebookId: string, noteIds: string[]) {
  return db.relations
    .from({ type: "notebook", id: notebookId }, "note")
    .has(...noteIds);
}

function selectMultiple(topic: Notebook, selected: NotebookReference[]) {
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

function selectSingle(topic: Notebook, array: NotebookReference[]) {
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

function stringifySelected(suggestion: NotebookReference[]) {
  const added = suggestion.filter((a) => a.new && a.op === "add");
  // .map(resolveReference)
  // .filter(Boolean);
  const removed = suggestion.filter((a) => a.op === "remove");
  // .map(resolveReference)
  // .filter(Boolean);
  if (!added.length && !removed.length) return;

  const parts = [];
  if (added.length > 0)
    parts.push(`added to ${pluralize(added.length, "notebook")}`);
  // if (added.length >= 1) parts.push(added[0]);
  // if (added.length > 1) parts.push(`and ${added.length - 1} others`);

  if (removed.length >= 1) {
    if (parts.length > 0) parts.push("&");
    parts.push(`removed from ${pluralize(added.length, "notebook")}`);
  }
  // if (removed.length > 1) parts.push(`and ${removed.length - 1} others`);

  return parts.join(" ") + ".";
}

// function resolveReference(ref: NotebookReference): string | undefined {
//   const notebook = db.notebooks.notebook(ref.id);
//   if (!notebook) return undefined;

//   // if (ref.topic) {
//   //   return notebook.topics.topic(ref.topic)?._topic?.title;
//   // } else {
//   return notebook.title;
//   // }
// }
