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
import { showToast } from "../utils/toast";
import { isMac } from "../utils/platform";
import { create } from "zustand";
import { Notebook } from "@notesnook/core";
import Field from "../components/field";
import { AddNotebookDialog } from "./add-notebook-dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../components/virtualized-tree";

type MoveNoteDialogProps = BaseDialogProps<boolean> & { noteIds: string[] };
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

export const MoveNoteDialog = DialogManager.register(function MoveNoteDialog({
  onClose,
  noteIds
}: MoveNoteDialogProps) {
  const setSelected = useSelectionStore((store) => store.setSelected);
  const setIsMultiselect = useSelectionStore((store) => store.setIsMultiselect);
  const isMultiselect = useSelectionStore((store) => store.isMultiselect);
  const refreshNotebooks = useStore((store) => store.refresh);
  const treeRef = useRef<VirtualizedTreeHandle<Notebook>>(null);
  const [notebooks, setNotebooks] = useState<string[]>([]);

  useEffect(() => {
    db.notebooks.roots
      .ids(db.settings.getGroupOptions("notebooks"))
      .then((ids) => setNotebooks(ids));
  }, []);

  useEffect(() => {
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
  }, [noteIds, refreshNotebooks, setSelected, setIsMultiselect]);

  useEffect(() => {
    treeRef.current?.refresh();
  }, [notebooks]);

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
      testId="move-note-dialog"
      isOpen={true}
      title={strings.selectNotebooks()}
      description={strings.selectNotebooksDesktopDesc(isMac() ? "Cmd" : "Ctrl")}
      onClose={() => _onClose(false)}
      width={500}
      noScroll
      positiveButton={{
        text: strings.done(),
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

          const added = selected.filter((a) => a.new && a.op === "add").length;
          const removed = selected.filter((a) => a.op === "remove").length;

          if (added > 0 || removed > 0) {
            showToast(
              "success",
              strings.assignedToNotebookMessage(noteIds.length, added, removed)
            );
          }

          _onClose(true);
        }
      }}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => _onClose(false)
      }}
    >
      <Flex
        id="subnotebooks"
        variant="columnFill"
        sx={{
          height: "80vh",
          px: 4
        }}
      >
        <Field
          autoFocus
          sx={{ m: 0, mb: 2 }}
          styles={{
            input: { p: "7.5px" }
          }}
          placeholder={strings.searchNotebooks()}
          onChange={async (e) => {
            const query = e.target.value.trim();
            const ids = await (query
              ? db.lookup.notebooks(query).ids()
              : db.notebooks.roots.ids(
                  db.settings.getGroupOptions("notebooks")
                ));
            setNotebooks(ids);
          }}
        />
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
            {strings.resetSelection()}
          </Button>
        )}
        {notebooks.length > 0 ? (
          <>
            <VirtualizedTree
              rootId={"root"}
              itemHeight={30}
              treeRef={treeRef}
              getChildNodes={async (id, depth) => {
                const nodes: TreeNode<Notebook>[] = [];
                if (id === "root") {
                  for (const id of notebooks) {
                    const notebook = (await db.notebooks.notebook(id))!;
                    const children = await db.relations
                      .from(notebook, "notebook")
                      .count();
                    nodes.push({
                      data: notebook,
                      depth: depth + 1,
                      hasChildren: children > 0,
                      id,
                      parentId: "root"
                    });
                  }
                  return nodes;
                }

                const subNotebooks = await db.relations
                  .from({ type: "notebook", id }, "notebook")
                  .resolve();

                for (const notebook of subNotebooks) {
                  const hasChildren =
                    (await db.relations.from(notebook, "notebook").count()) > 0;
                  nodes.push({
                    parentId: id,
                    id: notebook.id,
                    data: notebook,
                    depth: depth + 1,
                    hasChildren
                  });
                }

                return nodes;
              }}
              renderItem={({ item, expanded, index, collapse, expand }) => (
                <NotebookItem
                  notebook={item.data}
                  depth={item.depth}
                  isExpandable={item.hasChildren}
                  isExpanded={expanded}
                  toggle={expanded ? collapse : expand}
                  onCreateItem={() => {
                    treeRef.current?.refreshItem(index, item.data);
                  }}
                />
              )}
            />
          </>
        ) : (
          <Flex
            sx={{
              my: 2,
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Text variant="body">{strings.notebooksEmpty()}</Text>
            <Button
              data-test-id="add-new-notebook"
              variant="secondary"
              sx={{ mt: 2 }}
              onClick={() =>
                AddNotebookDialog.show({}).then((res) =>
                  res
                    ? db.notebooks.roots
                        .ids(db.settings.getGroupOptions("notebooks"))
                        .then((ids) => setNotebooks(ids))
                    : null
                )
              }
            >
              {strings.addNotebook()}
            </Button>
          </Flex>
        )}
      </Flex>
    </Dialog>
  );
});

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
            <ChevronDown
              data-test-id="collapse-notebook"
              size={20}
              sx={{ height: "20px" }}
            />
          ) : (
            <ChevronRight
              data-test-id="expand-notebook"
              size={20}
              sx={{ height: "20px" }}
            />
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
          data-test-id="add-sub-notebook"
          sx={{ p: "small" }}
        >
          <Plus
            size={18}
            title={strings.newNotebook()}
            onClick={async (e) => {
              e.stopPropagation();
              await AddNotebookDialog.show({ parentId: notebook.id });
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
