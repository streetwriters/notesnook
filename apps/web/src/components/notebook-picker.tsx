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
import { Plus, Check, Close, CaretDown, CaretRight, SearchIcon } from "./icons";
import { db } from "../common/db";
import { checkFeature } from "../common";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as appStore } from "../stores/app-store";
import { showToast } from "../utils/toast";
import { Notebook } from "@notesnook/core";
import Field from "./field";
import { AddNotebookDialog } from "../dialogs/add-notebook-dialog";
import { strings } from "@notesnook/intl";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "./virtualized-tree";
import { SelectedCheck } from "./selected-check";
import {
  RelationChange,
  selectMultiple,
  selectSingle,
  useRelationChangesStore
} from "../stores/relation-changes-store";

const notebookSortOptions = {
  sortBy: "dateCreated",
  sortDirection: "desc"
} as const;

export function NotebookPicker(props: {
  excludeId?: string;
  multiSelectable?: boolean;
  initialSelection: () => Promise<RelationChange[]>;
}) {
  const { excludeId, multiSelectable, initialSelection } = props;
  const treeRef = useRef<VirtualizedTreeHandle<Notebook>>(null);
  const [query, setQuery] = useState("");
  const [notebooks, setNotebooks] = useState<string[]>([]);
  const excludedIds = useRef<Set<string>>(new Set());
  const excludedParentId = useRef<string>();
  const searchId = useRef(0);
  const isMultiselect = useRef(false);
  const expandedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const { setSelected } = useRelationChangesStore.getState();
    let cancelled = false;
    const loadId = searchId.current;
    (async function () {
      const selected = await initialSelection();
      const ancestorIds = new Set<string>();
      for (const { id } of selected) {
        for (const crumb of await db.notebooks.breadcrumbs(id)) {
          if (crumb.id !== id) ancestorIds.add(crumb.id);
        }
      }

      if (excludeId) {
        excludedIds.current = new Set([
          excludeId,
          ...(await db.notebooks.subNotebookIds(excludeId))
        ]);
        excludedParentId.current = await db.notebooks.parentId(excludeId);
      }
      const roots = await db.notebooks.roots.ids(notebookSortOptions);
      if (cancelled) return;

      setSelected(selected);
      isMultiselect.current = !!multiSelectable && selected.length > 1;
      expandedIds.current = ancestorIds;
      if (loadId === searchId.current) setNotebooks(roots);
    })();
    return () => {
      cancelled = true;
      setSelected([]);
    };
  }, [excludeId, initialSelection, multiSelectable]);

  const select = useCallback(
    (notebook: Notebook, isCtrlPressed: boolean) => {
      const { selected, setSelected } = useRelationChangesStore.getState();
      if (multiSelectable && isCtrlPressed) isMultiselect.current = true;

      setSelected(
        isMultiselect.current
          ? selectMultiple(notebook, selected)
          : selectSingle(notebook, selected)
      );
    },
    [multiSelectable]
  );

  useEffect(() => {
    treeRef.current?.refresh();
  }, [notebooks]);

  const visibleNotebooks = notebooks.filter(
    (id) => !excludedIds.current.has(id)
  );

  return (
    <Flex
      id="subnotebooks"
      variant="columnFill"
      sx={{
        mx: "spacing7",
        mt: "spacing6",
        mb: "spacing7"
      }}
    >
      <Field
        autoFocus
        sx={{
          mb: "spacing4",
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
          const id = ++searchId.current;
          const query = e.target.value.trim();
          const ids = await (query
            ? db.lookup
                .notebooks(query)
                .sorted(notebookSortOptions)
                .then((results) => results.ids())
            : db.notebooks.roots.ids(notebookSortOptions));
          if (id === searchId.current) setNotebooks(ids);
        }}
        rightActions={[
          {
            icon: Close,
            onClick: async () => {
              setQuery("");
              const id = ++searchId.current;
              const ids = await db.notebooks.roots.ids(notebookSortOptions);
              if (id === searchId.current) setNotebooks(ids);
            },
            hidden: !query.trim()
          }
        ]}
      />
      {visibleNotebooks.length > 0 ? (
        <VirtualizedTree
          rootId={"root"}
          itemGap={7}
          treeRef={treeRef}
          getChildNodes={async ({ id, depth }) => {
            const toNode = async (
              notebook: Notebook,
              parentId: string
            ): Promise<TreeNode<Notebook>> => {
              let childrenCount = await db.relations
                .from(notebook, "notebook")
                .count();
              if (notebook.id === excludedParentId.current) childrenCount--;
              return {
                parentId,
                id: notebook.id,
                data: notebook,
                depth: depth + 1,
                hasChildren: childrenCount > 0,
                expanded: expandedIds.current.has(notebook.id)
              };
            };

            const nodes: TreeNode<Notebook>[] = [];
            if (id === "root") {
              for (const id of notebooks) {
                if (excludedIds.current.has(id)) continue;
                const notebook = (await db.notebooks.notebook(id))!;
                nodes.push(await toNode(notebook, "root"));
              }
              return nodes;
            }

            const subNotebooks = await db.relations
              .from({ type: "notebook", id }, "notebook")
              .selector.items(undefined, notebookSortOptions);

            for (const notebook of subNotebooks) {
              if (excludedIds.current.has(notebook.id)) continue;
              nodes.push(await toNode(notebook, id));
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
              onCreateSubNotebook={async (title) => {
                if (!(await addSubNotebook(item.data.id, title))) return false;
                treeRef.current?.refreshItem(index, item.data, {
                  expand: true
                });
                return true;
              }}
              onSelect={select}
            />
          )}
        />
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
  );
}

async function addSubNotebook(parentId: string, title: string) {
  try {
    const id = await db.notebooks.add({ title });
    if (!id) return false;

    await db.relations.add(
      { type: "notebook", id: parentId },
      { type: "notebook", id }
    );
    await notebookStore.refresh();
    await noteStore.refresh();
    await appStore.refreshNavItems();

    showToast("success", strings.actions.created.notebook(1));
    return true;
  } catch (e) {
    if (e instanceof Error) showToast("error", e.message);
    console.error(e);
    return false;
  }
}

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
  onCreateSubNotebook: (title: string) => Promise<boolean>;
  onSelect: (notebook: Notebook, isCtrlPressed: boolean) => void;
}) {
  const {
    notebook,
    isExpanded,
    toggle,
    depth,
    isExpandable,
    onCreateSubNotebook,
    onSelect
  } = props;

  const isSelected = useRelationChangesStore((store) =>
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
      onSelect(notebook, e.ctrlKey || e.metaKey);
    },
    [notebook, onSelect]
  );

  const createSubNotebook = async () => {
    const title = subNotebookTitle.trim();
    if (!title) {
      showToast("error", strings.titleIsRequired());
      return;
    }

    if (await onCreateSubNotebook(title)) {
      setIsAddingSubNotebook(false);
      setSubNotebookTitle("");
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
