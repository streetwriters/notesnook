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
  ChevronRight,
  Check,
  Close,
  CheckboxRemove,
  CaretDown,
  CaretRight,
  SearchIcon
} from "../components/icons";
import { db } from "../common/db";
import { checkFeature } from "../common";
import Dialog from "../components/dialog";
import { useStore } from "../stores/notebook-store";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as appStore } from "../stores/app-store";
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
import { Checkbox } from "../components/checkbox";

type MoveNoteDialogProps = BaseDialogProps<boolean> & { noteIds: string[] };

const notebookSortOptions = {
  sortBy: "dateCreated",
  sortDirection: "desc"
} as const;

export type SelectedReference = {
  id: string;
  new: boolean;
  op: "add" | "remove";
};

interface ISelectionStore {
  selected: SelectedReference[];
  isMultiselect: boolean;
  setSelected(refs: SelectedReference[]): void;
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
  const [query, setQuery] = useState("");
  const [notebooks, setNotebooks] = useState<string[]>([]);

  useEffect(() => {
    db.notebooks.roots
      .ids(notebookSortOptions)
      .then((ids) => setNotebooks(ids));
  }, []);

  useEffect(() => {
    (async function () {
      const selected: SelectedReference[] = useSelectionStore
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
      width={700}
      noScroll
      sx={{ minHeight: "553px" }}
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
          // height: "80vh",
          px: 4
        }}
      >
        <Field
          autoFocus
          sx={{
            my: "spacing7",
            input: {
              pl: "spacing10",
              py: "spacing6",
              pr: "spacing4",
              fontSize: "sm"
            }
          }}
          value={query}
          placeholder={strings.searchNotebooks()}
          leftIcon={SearchIcon}
          onChange={async (e) => {
            setQuery(e.target.value);
            const query = e.target.value.trim();
            const ids = await (query
              ? db.lookup
                  .notebooks(query)
                  .sorted(notebookSortOptions)
                  .then((results) => results.ids())
              : db.notebooks.roots.ids(notebookSortOptions));
            setNotebooks(ids);
          }}
          rightActions={[
            {
              icon: Close,
              onClick: async () => {
                setQuery("");
                setNotebooks(await db.notebooks.roots.ids(notebookSortOptions));
              },
              hidden: !query.trim()
            }
          ]}
        />
        {notebooks.length > 0 ? (
          <>
            <VirtualizedTree
              rootId={"root"}
              itemGap={7}
              treeRef={treeRef}
              getChildNodes={async ({ id, depth }) => {
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
                  .selector.items(undefined, notebookSortOptions);

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
                    treeRef.current?.refreshItem(index, item.data, {
                      expand: true
                    });
                  }}
                  multiSelectable
                />
              )}
            />
          </>
        ) : (
          <Flex
            sx={{
              height: "100%",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "spacing4"
            }}
          >
            <Text
              sx={{
                color: "paragraph-secondary",
                fontSize: "sm",
                lineHeight: "120%"
              }}
            >
              {strings.notebooksEmpty()}
            </Text>
            <Button
              data-test-id="add-new-notebook"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "spacing3",
                color: "accent",
                fontWeight: 600,
                fontSize: "sm"
              }}
              onClick={() =>
                AddNotebookDialog.show({}).then((res) =>
                  res
                    ? db.notebooks.roots
                        .ids(notebookSortOptions)
                        .then((ids) => setNotebooks(ids))
                    : null
                )
              }
            >
              <Plus size={15} color="accent" />
              {strings.addNotebook()}
            </Button>
          </Flex>
        )}
      </Flex>
    </Dialog>
  );
});

function calculateIndentation(depth: number, base: number) {
  if (depth === 0) return 0;
  else return depth * base;
}

export function NotebookItem(props: {
  notebook: Notebook;
  isExpanded: boolean;
  isExpandable: boolean;
  toggle: () => void;
  depth: number;
  onCreateItem: () => void;
  multiSelectable?: boolean;
}) {
  const {
    notebook,
    isExpanded,
    toggle,
    depth,
    isExpandable,
    onCreateItem,
    multiSelectable
  } = props;

  const setIsMultiselect = useSelectionStore((store) => store.setIsMultiselect);
  const setSelected = useSelectionStore((store) => store.setSelected);
  const isMultiselect = useSelectionStore((store) => store.isMultiselect);
  const isSelected = useSelectionStore((store) =>
    store.selected.some((item) => item.id === notebook.id && item.op === "add")
  );
  const [isAddingSubNotebook, setIsAddingSubNotebook] = useState(false);
  const [subNotebookTitle, setSubNotebookTitle] = useState("");
  const pendingAddRef = useRef(false);

  useEffect(() => {
    if (pendingAddRef.current && isExpanded) {
      pendingAddRef.current = false;
      return;
    }

    pendingAddRef.current = false;
    setIsAddingSubNotebook(false);
    setSubNotebookTitle("");
  }, [isExpanded]);

  const check = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
    ) => {
      e.stopPropagation();
      e.preventDefault();

      const { selected } = useSelectionStore.getState();

      const isCtrlPressed = e.ctrlKey || e.metaKey;
      if (isCtrlPressed) setIsMultiselect(true);

      if (multiSelectable && (isMultiselect || isCtrlPressed)) {
        setSelected(selectMultiple(notebook, selected));
      } else {
        setSelected(selectSingle(notebook, selected));
      }
    },
    [isMultiselect, multiSelectable, notebook, setIsMultiselect, setSelected]
  );

  const createSubNotebook = async () => {
    const title = subNotebookTitle.trim();
    if (!title) {
      showToast("error", strings.titleIsRequired());
      return;
    }

    try {
      const id = await db.notebooks.add({ title });
      if (!id) return;

      await db.relations.add(
        { type: "notebook", id: notebook.id },
        { type: "notebook", id }
      );
      await notebookStore.refresh();
      await noteStore.refresh();
      await appStore.refreshNavItems();

      showToast("success", strings.actions.created.notebook(1));
      setIsAddingSubNotebook(false);
      setSubNotebookTitle("");
      onCreateItem();
    } catch (e) {
      if (e instanceof Error) showToast("error", e.message);
      console.error(e);
    }
  };

  const cancelSubNotebook = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsAddingSubNotebook(false);
    setSubNotebookTitle("");
  };

  return (
    <>
      <Flex
        as="li"
        data-test-id="notebook"
        // as="summary"
        sx={{
          flex: 1,
          cursor: "pointer",
          justifyContent: "space-between",
          alignItems: "center",
          bg: isSelected ? "background-selected" : "background",
          borderRadius: "radius2",
          height: "40px",
          padding: "spacing4",
          ml: `${calculateIndentation(depth, 20)}px`,
          ':hover [data-test-id="add-sub-notebook"], :focus-within [data-test-id="add-sub-notebook"]':
            {
              opacity: 1
            },
          ":hover": {
            bg: isSelected ? "hover-selected" : "hover"
          }
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
        <Flex sx={{ alignItems: "center", gap: "spacing4", minWidth: 0 }}>
          <SelectedCheck size={15} item={notebook} onClick={check} />
          <Text
            className="title"
            data-test-id="notebook-title"
            sx={{
              color: isSelected ? "paragraph-selected" : "paragraph",
              fontSize: "sm",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden"
            }}
          >
            {notebook.title}
          </Text>
        </Flex>
        <Flex
          data-test-id="notebook-tools"
          sx={{ alignItems: "center", gap: "spacing3", flexShrink: 0 }}
        >
          <Button
            data-test-id="add-sub-notebook"
            variant="secondary"
            sx={{
              width: "20px",
              height: "20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
              bg: "transparent",
              opacity: 0,
              transition: "opacity 120ms ease",
              borderRadius: "radius0"
            }}
            onClick={async (e) => {
              e.stopPropagation();
              if (!(await checkFeature("notebooks"))) return;

              if (isExpandable && !isExpanded) {
                pendingAddRef.current = true;
                toggle();
              }
              setSubNotebookTitle("");
              setIsAddingSubNotebook(true);
            }}
          >
            <Plus size={15} title={strings.newNotebook()} />
          </Button>
          {isExpandable ? (
            <Button
              variant="secondary"
              sx={{
                width: "20px",
                height: "20px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
                bg: "transparent",
                borderRadius: "radius0"
              }}
            >
              {isExpanded ? (
                <CaretDown
                  data-test-id="collapse-notebook"
                  size={15}
                  color={isSelected ? "icon-selected" : "icon"}
                />
              ) : (
                <CaretRight
                  data-test-id="expand-notebook"
                  size={15}
                  color={isSelected ? "icon-selected" : "icon"}
                />
              )}
            </Button>
          ) : null}
        </Flex>
      </Flex>
      {isAddingSubNotebook && (
        <Flex
          as="li"
          data-test-id="sub-notebook-editor"
          sx={{
            ml: `${calculateIndentation(depth + 1, 20)}px`,
            flexDirection: "row",
            mt: "spacing3",
            gap: "spacing4",
            listStyle: "none",
            alignItems: "center"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Field
            autoFocus
            placeholder={strings.enterNotebookTitle()}
            value={subNotebookTitle}
            onChange={(e) => setSubNotebookTitle(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                createSubNotebook();
              } else if (e.key === "Escape") {
                setIsAddingSubNotebook(false);
                setSubNotebookTitle("");
              }
            }}
            sx={{ flex: 1, m: 0, gap: "spacing2" }}
            styles={{
              input: {
                fontSize: "sm",
                px: "spacing5",
                py: "spacing6",
                height: "45px"
              }
            }}
          />
          <Flex sx={{ gap: "spacing3" }}>
            <Button
              aria-label={strings.submit()}
              title={strings.submit()}
              disabled={!subNotebookTitle.trim()}
              onClick={(e) => {
                e.stopPropagation();
                createSubNotebook();
              }}
              sx={{
                width: "20px",
                height: "20px",
                p: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "radius0"
              }}
            >
              <Check size={15} color="accent" />
            </Button>
            <Button
              aria-label={strings.cancel()}
              title={strings.cancel()}
              onClick={cancelSubNotebook}
              sx={{
                width: "20px",
                height: "20px",
                p: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "radius0"
              }}
            >
              <Close size={15} color="icon" />
            </Button>
          </Flex>
        </Flex>
      )}
    </>
  );
}

export function SelectedCheck({
  item,
  size = 20,
  onClick
}: {
  item?: { id: string };
  size?: number;
  onClick?: (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.KeyboardEvent<HTMLDivElement>
  ) => void;
}) {
  const selectedItems = useSelectionStore((store) => store.selected);
  const selectedItem =
    item && selectedItems[findSelectionIndex(item, selectedItems)];

  if (selectedItem?.op === "remove") {
    return (
      <CheckboxRemove size={size} onClick={onClick} color="accent-error" />
    );
  }

  return (
    <Checkbox
      onToggle={onClick}
      size={size}
      checked={selectedItem?.op === "add"}
      aria-label="Select item"
      checkboxUncheckedIconColor="icon-disabled"
    />
  );
}

function createSelection(item: { id: string }): SelectedReference {
  return {
    id: item.id,
    op: "add",
    new: true
  };
}

function findSelectionIndex(ref: { id: string }, array: { id: string }[]) {
  return array.findIndex((a) => a.id === ref.id);
}

function notebookHasNotes(notebookId: string, noteIds: string[]) {
  return db.relations
    .from({ type: "notebook", id: notebookId }, "note")
    .has(...noteIds);
}

export function selectMultiple(
  topic: { id: string },
  selected: SelectedReference[]
) {
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

function selectSingle(topic: { id: string }, array: SelectedReference[]) {
  const selected: SelectedReference[] = array.filter((ref) => !ref.new);

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
