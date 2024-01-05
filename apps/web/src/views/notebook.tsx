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
import ListContainer from "../components/list-container";
import { useStore as useAppStore } from "../stores/app-store";
import { hashNavigate, navigate } from "../navigation";
import { Button, Flex, Text } from "@theme-ui/components";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  MoreHorizontal,
  Notebook2,
  RemoveShortcutLink,
  ShortcutLink,
  SortAsc
} from "../components/icons";
import { pluralize } from "@notesnook/common";
import { Allotment, AllotmentHandle } from "allotment";
import { Plus } from "../components/icons";
import {
  notesFromContext,
  useStore as useNotesStore
} from "../stores/note-store";
import { useStore as useNotebookStore } from "../stores/notebook-store";
import Placeholder from "../components/placeholders";
import { db } from "../common/db";
import { getFormattedDate } from "@notesnook/common";
import { showAddNotebookDialog } from "../common/dialog-controller";
import {
  UncontrolledTreeEnvironment,
  Tree,
  TreeItemIndex,
  TreeEnvironmentRef
} from "react-complex-tree";
// import "react-complex-tree/lib/style-modern.css";
import SubNotebook from "../components/sub-notebook";
import { NotebookContext } from "../components/list-container/types";
import { FlexScrollContainer } from "../components/scroll-container";
import { Menu } from "../hooks/use-menu";
import Config from "../utils/config";
import { useSearch } from "../hooks/use-search";
import { useEditorStore } from "../stores/editor-store";

type NotebookProps = {
  rootId: string;
  notebookId?: string;
};
function Notebook(props: NotebookProps) {
  const { rootId, notebookId } = props;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const paneRef = useRef<AllotmentHandle>(null);
  const sizes = useRef<number[]>([]);

  const context = useNotesStore((store) => store.context);
  const notes = useNotesStore((store) => store.contextNotes);
  const refreshContext = useNotesStore((store) => store.refreshContext);
  const isCompact = useNotesStore((store) => store.viewMode === "compact");
  const filteredItems = useSearch(
    "notes",
    (query) => {
      if (!context || context.type !== "notebook") return;
      const notes = notesFromContext(context);
      return db.lookup.notes(query, notes).sorted();
    },
    [context, notes]
  );

  useEffect(() => {
    const { context, setContext } = useNotesStore.getState();
    if (
      context &&
      context.type === "notebook" &&
      context.id &&
      (context.id === rootId || context.id === notebookId)
    )
      return;
    if (!notebookId && !rootId) return;

    console.log("setContext", context, notebookId, rootId);
    setContext({ type: "notebook", id: notebookId || rootId });
  }, [rootId, notebookId]);

  const toggleCollapse = useCallback((isCollapsed: boolean) => {
    if (!paneRef.current || !sizes.current) return;

    if (!isCollapsed) {
      if (sizes.current[1] < 60) {
        paneRef.current.reset();
      } else {
        paneRef.current.resize(sizes.current);
      }
    }
  }, []);

  useEffect(() => {
    toggleCollapse(isCollapsed);
  }, [isCollapsed, toggleCollapse]);

  console.log(context, rootId, notebookId);
  if (!context || !notes || context.type !== "notebook") return null;
  return (
    <>
      <Allotment
        ref={paneRef}
        vertical
        onChange={(paneSizes) => {
          const [_, topicsPane] = paneSizes;
          if (topicsPane > 30 && !isCollapsed) sizes.current = paneSizes;
        }}
        onDragEnd={([_, topicsPane]) => {
          if (topicsPane < 35 && !isCollapsed) {
            setIsCollapsed(true);
          }
        }}
      >
        <Allotment.Pane>
          <Flex variant="columnFill" sx={{ height: "100%" }}>
            <ListContainer
              group="notes"
              refresh={refreshContext}
              compact={isCompact}
              context={context}
              items={filteredItems || notes}
              placeholder={<Placeholder context="notes" />}
              header={
                <NotebookHeader
                  key={context.id}
                  rootId={rootId}
                  context={context}
                />
              }
              button={{
                onClick: () => useEditorStore.getState().newSession()
              }}
            />
          </Flex>
        </Allotment.Pane>
        <Allotment.Pane
          preferredSize={250}
          visible
          maxSize={isCollapsed ? 30 : Infinity}
        >
          <SubNotebooks
            notebookId={notebookId}
            isCollapsed={isCollapsed}
            rootId={rootId}
            onClick={() => {
              setIsCollapsed((isCollapsed) => !isCollapsed);
            }}
          />
        </Allotment.Pane>
      </Allotment>
    </>
  );
}
export default Notebook;

type SubNotebooksProps = {
  notebookId?: string;
  rootId: string;
  isCollapsed: boolean;
  onClick: () => void;
};
function SubNotebooks({
  notebookId,
  rootId,
  isCollapsed,
  onClick
}: SubNotebooksProps) {
  // sometimes the onClick event is triggered on dragEnd
  // which shouldn't happen. To prevent that we make sure
  // that onMouseDown & onMouseUp events got called.
  const mouseEventCounter = useRef(0);
  const treeRef = useRef<TreeEnvironmentRef>(null);
  const reloadItem = useRef<(changedItemIds: TreeItemIndex[]) => void>();
  const notebooks = useNotebookStore((store) => store.notebooks);
  const contextNotes = useNotesStore((store) => store.contextNotes);
  const context = useNotesStore((store) => store.context);

  const saveViewState = useCallback((id: string) => {
    if (!treeRef.current?.viewState) return;
    Config.set(`${id}:viewState`, treeRef.current.viewState[id]);
  }, []);

  useEffect(() => {
    const items: TreeItemIndex[] = [];
    for (const item in treeRef.current?.items) {
      if (item === "root") continue;
      items.push(item);
    }
    reloadItem.current?.(items);
  }, [notebooks, notebookId]);

  useEffect(() => {
    if (
      !context ||
      context?.type !== "notebook" ||
      !context.id ||
      !treeRef.current?.items[context.id]
    )
      return;
    reloadItem.current?.([context.id]);
  }, [contextNotes, context]);

  if (!rootId) return null;

  return (
    <Flex id="subnotebooks" variant="columnFill" sx={{ height: "100%" }}>
      <Flex
        sx={{
          m: 1,
          ml: 1,
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer"
        }}
        onMouseDown={() => {
          mouseEventCounter.current = 1;
        }}
        onMouseUp={() => {
          mouseEventCounter.current++;
        }}
        onClick={() => {
          if (mouseEventCounter.current === 2) onClick();
          mouseEventCounter.current = 0;
        }}
      >
        <Flex sx={{ alignItems: "center" }}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <Text variant="subBody" sx={{ fontSize: 11 }}>
            NOTEBOOKS
          </Text>
        </Flex>
        <Flex sx={{ alignItems: "center" }}>
          <Button
            variant="secondary"
            data-test-id="subnotebooks-sort-button"
            sx={{
              p: "small",
              bg: "transparent",
              visibility: isCollapsed ? "collapse" : "visible"
            }}
            onClick={(e) => {
              e.stopPropagation();
              // showSortMenu("topics", () => refresh(selectedNotebook.id));
            }}
          >
            <SortAsc size={15} />
          </Button>
          <Button
            variant="secondary"
            data-test-id="subnotebooks-action-button"
            sx={{
              p: "1px",
              bg: "transparent",
              visibility: isCollapsed ? "collapse" : "visible"
            }}
            onClick={async (e) => {
              e.stopPropagation();
              await showAddNotebookDialog(rootId);
            }}
          >
            <Plus size={20} />
          </Button>
        </Flex>
      </Flex>

      <FlexScrollContainer>
        <UncontrolledTreeEnvironment
          ref={treeRef}
          onFocusItem={(item) => {
            const element = document.getElementById(`id_${item.index}`);
            if (!element) return;
            setTimeout(() => {
              element.focus();
              element.scrollIntoView();
            });
          }}
          onPrimaryAction={(item) => {
            const element = document.getElementById(`id_${item.index}`);
            if (!element) return;
            element.click();
          }}
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
                  data: { notebook: { title: "Root" } },
                  index: itemId,
                  isFolder: true,
                  canMove: false,
                  canRename: false,
                  children: [rootId]
                };
              }

              const notebook = (await db.notebooks.notebook(itemId as string))!;
              const children = await db.relations
                .from({ type: "notebook", id: itemId as string }, "notebook")
                .get();
              return {
                index: itemId,
                data: { notebook },
                children: children.map((i) => i.toId),
                isFolder: children.length > 0
              };
            },
            async getTreeItems(itemIds) {
              console.log("get tree items:", itemIds);
              const notebooks = await db.notebooks.all.records(
                itemIds as string[],
                db.settings.getGroupOptions("notebooks")
              );
              const allChildren = await db.relations
                .from({ type: "notebook", ids: itemIds as string[] }, [
                  "notebook",
                  "note"
                ])
                .get();
              return itemIds.filter(Boolean).map((id) => {
                if (id === "root") {
                  return {
                    data: { notebook: { title: "Root" } },
                    index: id,
                    isFolder: true,
                    canMove: false,
                    canRename: false,
                    children: [rootId]
                  };
                }

                const notebook = notebooks[id];
                const children = allChildren
                  .filter((r) => r.fromId === id && r.toType === "notebook")
                  .map((r) => r.toId);
                const totalNotes = allChildren.filter(
                  (r) => r.fromId === id && r.toType === "note"
                ).length;
                return {
                  index: id,
                  data: { notebook, totalNotes },
                  children: children,
                  isFolder: children.length > 0
                };
              });
            }
          }}
          renderItem={(props) => (
            <>
              <SubNotebook
                item={props.item.data.notebook}
                totalNotes={props.item.data.totalNotes}
                depth={props.depth}
                isExpandable={props.item.isFolder || false}
                isExpanded={props.context.isExpanded || false}
                collapse={props.context.collapseItem}
                expand={props.context.expandItem}
                focus={props.context.focusItem}
                rootId={rootId}
                refresh={() =>
                  reloadItem.current && reloadItem.current([props.item.index])
                }
              />
              {props.children}
            </>
          )}
          getItemTitle={(item) => item.data.notebook.title}
          viewState={{
            [rootId]: Config.get(`${rootId}:viewState`, {
              expandedItems: [notebookId || rootId],
              focusedItem: notebookId || rootId
            })
          }}
          onExpandItem={(_, id) => saveViewState(id)}
          onCollapseItem={(_, id) => saveViewState(id)}
        >
          <Tree
            treeId={rootId}
            renderTreeContainer={({ children, containerProps }) => (
              <div data-test-id="subnotebooks-list" {...containerProps}>
                {children}
              </div>
            )}
            rootItem="root"
            treeLabel="Tree Example"
          />
        </UncontrolledTreeEnvironment>
      </FlexScrollContainer>
    </Flex>
  );
}

function NotebookHeader({
  rootId,
  context
}: {
  rootId: string;
  context: NotebookContext;
}) {
  const moreCrumbsRef = useRef<HTMLButtonElement>(null);
  const [notebook, setNotebook] = useState(context.item);
  const [totalNotes, setTotalNotes] = useState(context.totalNotes);
  const [crumbs, setCrumbs] = useState<{ id: string; title: string }[]>([]);
  const [isShortcut, setIsShortcut] = useState(false);
  const shortcuts = useAppStore((store) => store.shortcuts);
  const addToShortcuts = useAppStore((store) => store.addToShortcuts);

  useEffect(() => {
    setIsShortcut(shortcuts.findIndex((p) => p.id === context.id) > -1);
  }, [shortcuts, context.id]);

  useEffect(() => {
    (async function () {
      if (!notebook) setNotebook(await db.notebooks.notebook(context.id));
      if (totalNotes === undefined)
        setTotalNotes(
          await db.relations
            .from({ type: "notebook", id: context.id }, "note")
            .count()
        );
    })();
  }, [context.id, totalNotes, notebook]);

  useEffect(() => {
    (async function () {
      setCrumbs(await db.notebooks.breadcrumbs(context.id));
    })();
  }, [context.id]);

  if (!notebook) return null;
  const { title, description, dateEdited } = notebook;

  return (
    <Flex mx={2} my={2} sx={{ flexDirection: "column", minWidth: 200 }}>
      <Flex sx={{ alignItems: "center", mb: 1 }}>
        <Button
          ref={moreCrumbsRef}
          variant="icon"
          sx={{ p: 0, flexShrink: 0 }}
          onClick={() => navigateCrumb("notebooks")}
          title="Notebooks"
        >
          <Notebook2 size={14} />
        </Button>
        <ChevronRight as="span" size={14} />
        {crumbs.length > 2 ? (
          <>
            <Button
              ref={moreCrumbsRef}
              variant="icon"
              sx={{ p: 0, flexShrink: 0 }}
              onClick={() => {
                if (!moreCrumbsRef.current) return;
                Menu.openMenu(
                  crumbs
                    .slice(0, -2)
                    .reverse()
                    .map((c) => ({
                      type: "button",
                      title: c.title,
                      key: c.id,
                      icon: Notebook2.path,
                      onClick: () => navigateCrumb(c.id, rootId)
                    })),
                  {
                    position: {
                      target: moreCrumbsRef.current,
                      location: "below",
                      isTargetAbsolute: true,
                      align: "start",
                      yOffset: 10
                    }
                  }
                );
              }}
            >
              <MoreHorizontal size={14} />
            </Button>
            <ChevronRight as="span" size={14} />
          </>
        ) : null}
        <Text
          as="p"
          sx={{
            lineHeight: 0.7,
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden"
          }}
        >
          {crumbs.slice(-2).map((crumb, index, array) => (
            <>
              <Text
                as="span"
                sx={{
                  fontSize: "subBody",
                  textDecoration: "none",
                  color: "var(--paragraph-secondary)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  cursor: "pointer",
                  ":hover": { color: "paragraph-hover" }
                }}
                onClick={() => navigateCrumb(crumb.id, rootId)}
              >
                {crumb.title}
              </Text>
              {index === array.length - 1 ? null : (
                <ChevronRight
                  as="span"
                  sx={{ display: "inline", verticalAlign: "middle" }}
                  size={14}
                />
              )}
            </>
          ))}
        </Text>
      </Flex>
      <Text variant="subBody">{getFormattedDate(dateEdited, "date")}</Text>
      <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="heading" sx={{ fontSize: "subheading" }}>
          {title}
        </Text>
        <Flex>
          <Button
            variant="secondary"
            sx={{ borderRadius: 100, width: 30, height: 30 }}
            mr={1}
            p={0}
            title={isShortcut ? "Remove shortcut" : "Create shortcut"}
            onClick={() => addToShortcuts(notebook)}
          >
            {isShortcut ? (
              <RemoveShortcutLink size={16} />
            ) : (
              <ShortcutLink size={16} />
            )}
          </Button>
          <Button
            variant="secondary"
            sx={{ borderRadius: 100, width: 30, height: 30 }}
            p={0}
            title="Edit notebook"
            onClick={() => hashNavigate(`/notebooks/${notebook.id}/edit`)}
          >
            <Edit size={16} />
          </Button>
        </Flex>
      </Flex>

      {description && (
        <Text variant="body" sx={{ fontSize: "subtitle" }}>
          {description}
        </Text>
      )}
      <Text as="em" variant="subBody" mt={2}>
        {/* {pluralize(topics.length, "topic")},  */}
        {pluralize(totalNotes, "note")}
      </Text>
    </Flex>
  );
}

function navigateCrumb(notebookId: string, rootId?: string) {
  if (notebookId === "notebooks") navigate("/notebooks");
  else if (rootId && notebookId === rootId) {
    navigate(`/notebooks/${rootId}`);
  } else if (rootId && notebookId) {
    navigate(`/notebooks/${rootId}/${notebookId}`);
  }
}
