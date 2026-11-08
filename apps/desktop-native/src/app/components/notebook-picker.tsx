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
import { Button, Flex, ScrollContainer, Text } from "@ui";
import { strings } from "@notesnook/intl";
import type { Notebook } from "@notesnook/core";
import { CaretDown, CaretRight, Check, Close, Plus, SearchIcon } from "./icons";
import { db } from "../common/db";
import { checkFeature } from "../common";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as appStore } from "../stores/app-store";
import { showToast } from "../utils/toast";
import {
  RelationChange,
  selectMultiple,
  selectSingle,
  useRelationChangesStore
} from "../stores/relation-changes-store";
import { AddNotebookDialog } from "../dialogs/add-notebook-dialog";
import Field from "./field";
import { SelectedCheck } from "./selected-check";

const notebookSortOptions = {
  sortBy: "dateCreated",
  sortDirection: "desc"
} as const;

type Row = {
  notebook: Notebook;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
};

export function NotebookPicker(props: {
  excludeId?: string;
  multiSelectable?: boolean;
  initialSelection: () => Promise<RelationChange[]>;
}) {
  const { excludeId, multiSelectable, initialSelection } = props;
  const [query, setQuery] = useState("");
  const [fieldKey, setFieldKey] = useState(0);
  const [roots, setRoots] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [revision, setRevision] = useState(0);
  const excludedIds = useRef<Set<string>>(new Set());
  const excludedParentId = useRef<string | undefined>(undefined);
  const searchId = useRef(0);
  const isMultiselect = useRef(false);

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
        excludedParentId.current =
          (await db.notebooks.parentId(excludeId)) || undefined;
      }
      const ids = await db.notebooks.roots.ids(notebookSortOptions);
      if (cancelled) return;

      setSelected(selected);
      isMultiselect.current = !!multiSelectable && selected.length > 1;
      setExpandedIds(ancestorIds);
      if (loadId === searchId.current) setRoots(ids);
    })();
    return () => {
      cancelled = true;
      setSelected([]);
    };
  }, [excludeId, initialSelection, multiSelectable]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result: Row[] = [];
      const toRow = async (notebook: Notebook, depth: number) => {
        let childrenCount = await db.relations
          .from(notebook, "notebook")
          .count();
        if (notebook.id === excludedParentId.current) childrenCount--;
        const row: Row = {
          notebook,
          depth,
          hasChildren: childrenCount > 0,
          expanded: expandedIds.has(notebook.id)
        };
        result.push(row);
        if (row.expanded && row.hasChildren) {
          const subNotebooks = await db.relations
            .from({ type: "notebook", id: notebook.id }, "notebook")
            .selector.items(undefined, notebookSortOptions);
          for (const sub of subNotebooks) {
            if (excludedIds.current.has(sub.id)) continue;
            await toRow(sub, depth + 1);
          }
        }
      };
      for (const id of roots) {
        if (excludedIds.current.has(id)) continue;
        const notebook = await db.notebooks.notebook(id);
        if (notebook) await toRow(notebook, 0);
      }
      if (!cancelled) setRows(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [roots, expandedIds, revision]);

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

  const toggle = useCallback((id: string) => {
    setExpandedIds((ids) => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <Flex
      testID="subnotebooks"
      sx={{
        flexDirection: "column",
        flex: 1,
        mx: "spacing7",
        mt: "spacing6",
        mb: "spacing7"
      }}
    >
      <Field
        key={fieldKey}
        autoFocus
        sx={{ mb: "spacing4" }}
        styles={{ input: { pl: 30 } }}
        placeholder={strings.searchNotebooks()}
        leftIcon={SearchIcon}
        onChangeText={async (text) => {
          setQuery(text);
          const id = ++searchId.current;
          const trimmed = text.trim();
          const ids = await (trimmed
            ? db.lookup
                .notebooks(trimmed)
                .sorted(notebookSortOptions)
                .then((results) => results.ids())
            : db.notebooks.roots.ids(notebookSortOptions));
          if (id === searchId.current) setRoots(ids);
        }}
        rightActions={[
          {
            icon: Close,
            onClick: async () => {
              setQuery("");
              setFieldKey((k) => k + 1);
              const id = ++searchId.current;
              const ids = await db.notebooks.roots.ids(notebookSortOptions);
              if (id === searchId.current) setRoots(ids);
            },
            hidden: !query.trim()
          }
        ]}
      />
      {rows.length > 0 ? (
        <ScrollContainer sx={{ flex: 1 }}>
          <Flex sx={{ flexDirection: "column", gap: 7 }}>
            {rows.map((row) => (
              <NotebookItem
                key={row.notebook.id}
                notebook={row.notebook}
                depth={row.depth}
                isExpandable={row.hasChildren}
                isExpanded={row.expanded}
                toggle={() => toggle(row.notebook.id)}
                onCreateSubNotebook={async (title) => {
                  if (!(await addSubNotebook(row.notebook.id, title)))
                    return false;
                  setExpandedIds((ids) => new Set(ids).add(row.notebook.id));
                  setRevision((r) => r + 1);
                  return true;
                }}
                onSelect={select}
              />
            ))}
          </Flex>
        </ScrollContainer>
      ) : (
        <Flex
          sx={{
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "spacing4"
          }}
        >
          <Text sx={{ color: "paragraph-secondary", fontSize: "sm" }}>
            {strings.notebooksEmpty()}
          </Text>
          <Button
            testID="add-new-notebook"
            variant="secondary"
            sx={{ flexDirection: "row", alignItems: "center", gap: "spacing3" }}
            onPress={() =>
              AddNotebookDialog.show({}).then((res: boolean | false) =>
                res
                  ? db.notebooks.roots
                      .ids(notebookSortOptions)
                      .then((ids) => setRoots(ids))
                  : null
              )
            }
          >
            <Plus size={15} color="accent" />
            <Text sx={{ color: "accent", fontWeight: 600, fontSize: "sm" }}>
              {strings.addNotebook()}
            </Text>
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

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex
        testID="notebook"
        onPress={(e) => {
          if (!isExpandable) {
            onSelect(notebook, e.ctrlKey || e.metaKey);
            return;
          }
          toggle();
        }}
        sx={{
          flexDirection: "row",
          cursor: "pointer",
          justifyContent: "space-between",
          alignItems: "center",
          bg: isSelected ? "background-selected" : "background",
          borderRadius: "radius2",
          height: 40,
          padding: "spacing4",
          ml: depth * 20,
          ":hover": { bg: isSelected ? "hover-selected" : "hover" }
        }}
      >
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: "spacing4",
            minWidth: 0
          }}
        >
          <SelectedCheck
            size={15}
            item={notebook}
            onPress={(ctrl) => onSelect(notebook, ctrl)}
          />
          <Text
            testID="notebook-title"
            numberOfLines={1}
            sx={{
              minWidth: 0,
              color: isSelected ? "paragraph-selected" : "paragraph",
              fontSize: "sm"
            }}
          >
            {notebook.title}
          </Text>
        </Flex>
        <Flex
          testID="notebook-tools"
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: "spacing3",
            flexShrink: 0
          }}
        >
          <Flex
            testID="add-sub-notebook"
            title={strings.newNotebook()}
            onPress={async (e) => {
              e.stopPropagation();
              if (!(await checkFeature("notebooks"))) return;
              if (isExpandable && !isExpanded) toggle();
              setSubNotebookTitle("");
              setIsAddingSubNotebook(true);
            }}
            sx={{
              width: 20,
              height: 20,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "radius0",
              ":hover": { bg: "hover" }
            }}
          >
            <Plus size={15} />
          </Flex>
          {isExpandable ? (
            <Flex sx={{ width: 20, height: 20, alignItems: "center" }}>
              {isExpanded ? (
                <CaretDown
                  size={15}
                  color={isSelected ? "icon-selected" : "icon"}
                />
              ) : (
                <CaretRight
                  size={15}
                  color={isSelected ? "icon-selected" : "icon"}
                />
              )}
            </Flex>
          ) : null}
        </Flex>
      </Flex>
      {isAddingSubNotebook && (
        <Flex
          testID="sub-notebook-editor"
          sx={{
            ml: (depth + 1) * 20,
            flexDirection: "row",
            mt: "spacing3",
            gap: "spacing4",
            alignItems: "center"
          }}
        >
          <Field
            autoFocus
            placeholder={strings.enterNotebookTitle()}
            value={subNotebookTitle}
            onChangeText={setSubNotebookTitle}
            onSubmit={() => createSubNotebook()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setIsAddingSubNotebook(false);
                setSubNotebookTitle("");
              }
            }}
            sx={{ flex: 1, m: 0, gap: "spacing2" }}
            styles={{ input: { height: 45 } }}
          />
          <Flex sx={{ flexDirection: "row", gap: "spacing3" }}>
            <Flex
              title={strings.submit()}
              onPress={() => createSubNotebook()}
              sx={{
                width: 20,
                height: 20,
                opacity: subNotebookTitle.trim() ? 1 : 0.4,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Check size={15} color="accent" />
            </Flex>
            <Flex
              title={strings.cancel()}
              onPress={() => {
                setIsAddingSubNotebook(false);
                setSubNotebookTitle("");
              }}
              sx={{
                width: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Close size={15} color="icon" />
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
