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

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore as useAppStore } from "../../stores/app-store";
import { hashNavigate, navigate } from "../../navigation";
import { Button, Flex, Text } from "@theme-ui/components";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  MoreHorizontal,
  Notebook2,
  RemoveShortcutLink,
  ShortcutLink
} from "../icons";
import { Plus } from "..//icons";
import { useStore as useNotesStore } from "../../stores/note-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { db } from "../../common/db";
import { getFormattedDate, usePromise } from "@notesnook/common";
import SubNotebook from "../sub-notebook";
import { NotebookContext } from "../list-container/types";
import { Menu } from "../../hooks/use-menu";
import Notes from "../../views/notes";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
  ImperativePanelHandle
} from "react-resizable-panels";
import { AddNotebookDialog } from "../../dialogs/add-notebook-dialog";
import { strings } from "@notesnook/intl";
import {
  EV,
  EVENTS,
  Notebook,
  Notebook as NotebookType
} from "@notesnook/core";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../virtualized-tree";
import { store, useStore } from "../../stores/notebook-store";
import { useSearch } from "../../hooks/use-search";
import ListContainer from "../list-container";
import { useParams } from "wouter";
import Placeholder from "../placeholders";

type NotebookProps = {
  // rootId: string;
  // notebookId?: string;
};
function NotebookTree(props: NotebookProps) {
  // const { rootId, notebookId } = props;
  // const notebooks = useStore((state) => state.notebooks);
  // const [isCollapsed, setIsCollapsed] = useState(false);

  // const subNotebooksPane = useRef<ImperativePanelHandle>(null);

  // const context = useNotesStore((store) => store.context);
  // const notes = useNotesStore((store) => store.contextNotes);

  // useLayoutEffect(() => {
  //   const { context, setContext } = useNotesStore.getState();
  //   if (
  //     context &&
  //     context.type === "notebook" &&
  //     context.id &&
  //     (context.id === rootId || context.id === notebookId)
  //   )
  //     return;
  //   if (!notebookId && !rootId) return;

  //   Promise.all([
  //     !!notebookId && db.notebooks.exists(notebookId),
  //     db.notebooks.exists(rootId)
  //   ]).then((exists) => {
  //     if (exists.every((e) => !e)) {
  //       navigate(`/notebooks`, { replace: true });
  //       return;
  //     }
  //     setContext({ type: "notebook", id: notebookId || rootId });
  //   });
  // }, [rootId, notebookId]);

  // if (!context || !notes || context.type !== "notebook") return null;

  const notebooks = useStore((state) => state.notebooks);
  const refresh = useStore((state) => state.refresh);
  const filteredItems = useSearch("notebooks", (query) =>
    db.lookup.notebooks(query).sorted()
  );
  const isCompact = useStore((store) => store.viewMode === "compact");

  useEffect(() => {
    store.get().refresh();
  }, []);

  if (!notebooks) return <p>loading</p>;
  if (notebooks.length === 0) {
    return (
      <Flex variant="columnCenterFill" data-test-id="list-placeholder">
        <Placeholder context="notebooks" />
      </Flex>
    );
  }
  return (
    <>
      <div style={{ height: "100vh" }}>
        <SubNotebooks />
      </div>
      {/* <ListContainer
        refresh={refresh}
        // @ts-ignore
        items={filteredItems || notebooks}
        placeholder={<p>placeholder</p>}
        compact={false}
        button={{
          onClick: () => hashNavigate("/notebooks/create")
        }}
        renderer={<p>hello</p>}
      /> */}
    </>
  );
}
export default NotebookTree;

export function SubNotebooks() {
  // sometimes the onClick event is triggered on dragEnd
  // which shouldn't happen. To prevent that we make sure
  // that onMouseDown & onMouseUp events got called.
  const mouseEventCounter = useRef(0);
  const treeRef =
    useRef<VirtualizedTreeHandle<{ notebook: Notebook; totalNotes: number }>>(
      null
    );
  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);
  const isSelected = useSelectionStore((store) => store.isSelected);
  const selectItem = useSelectionStore((store) => store.selectItem);
  const deselectItem = useSelectionStore((store) => store.deselectItem);
  const toggleSelection = useSelectionStore(
    (store) => store.toggleSelectionMode
  );
  const notebooks = useStore((store) => store.notebooks);
  const [notebookIds, setNotebookIds] = useState<string[]>([]);

  useEffect(() => {
    notebooks?.ids().then((ids) => setNotebookIds(ids));
    // treeRef.current?.refresh();
    // db.notebooks.roots
    // .ids(db.settings.getGroupOptions("notebooks"))
    // .then((ids) => setNotebookIds(ids));
  }, [notebooks]);

  useEffect(() => {
    treeRef.current?.refresh();
  }, [notebookIds]);

  return (
    <Flex
      id="notebook-trees"
      variant="columnFill"
      sx={{
        height: "100%",
        borderTop: "1px solid var(--border)"
      }}
    >
      <VirtualizedTree
        rootId={"root"}
        itemHeight={30}
        treeRef={treeRef}
        deselectAll={() => toggleSelection(false)}
        bulkSelect={setSelectedItems}
        isSelected={isSelected}
        onDeselect={deselectItem}
        onSelect={selectItem}
        saveKey="notebook-tree"
        getChildNodes={async (id, depth) => {
          const nodes: TreeNode<{ notebook: Notebook; totalNotes: number }>[] =
            [];
          if (id === "root") {
            for (const id of notebookIds) {
              const notebook = (await db.notebooks.notebook(id))!;
              const totalNotes = await db.relations
                .from(notebook, "note")
                .count();
              const children = await db.relations
                .from(notebook, "notebook")
                .count();
              nodes.push({
                data: { notebook, totalNotes },
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
            const totalNotes = await db.relations
              .from(notebook, "note")
              .count();
            nodes.push({
              parentId: id,
              id: notebook.id,
              data: { notebook, totalNotes },
              depth: depth + 1,
              hasChildren
            });
          }

          return nodes;
        }}
        renderItem={({ collapse, expand, expanded, index, item: node }) => (
          <SubNotebook
            depth={node.depth}
            isExpandable={node.hasChildren}
            item={node.data.notebook}
            isExpanded={expanded}
            rootId={node.parentId}
            totalNotes={node.data.totalNotes}
            refresh={async () => {
              const notebook = await db.notebooks.notebook(node.id);
              const totalNotes = await db.relations
                .from(node.data.notebook, "note")
                .count();
              treeRef.current?.refreshItem(
                index,
                notebook ? { notebook, totalNotes } : undefined
              );
            }}
            collapse={collapse}
            expand={expand}
          />
        )}
        // renderItem={({ item, expanded, index, collapse, expand }) => (
        //   <NotebookItem
        //     notebook={item.data}
        //     depth={item.depth}
        //     isExpandable={item.hasChildren}
        //     isExpanded={expanded}
        //     toggle={expanded ? collapse : expand}
        //     onCreateItem={() => {
        //       treeRef.current?.refreshItem(index, item.data);
        //     }}
        //   />
        // )}
      />
      {/* <VirtualizedTree
        itemHeight={28}
        getChildNodes={fetchChildren}
        rootId={"root"}
        deselectAll={() => toggleSelection(false)}
        bulkSelect={setSelectedItems}
        isSelected={isSelected}
        onDeselect={deselectItem}
        onSelect={selectItem}
        treeRef={treeRef}
        placeholder={() => (
          <Text variant="subBody" sx={{ mx: 2 }}>
            {strings.emptyPlaceholders("notebook")}
          </Text>
        )}
        saveKey={`${rootId}-subnotebooks`}
        testId="subnotebooks-list"
        renderItem={({ collapse, expand, expanded, index, item: node }) => (
          <SubNotebook
            depth={node.depth}
            isExpandable={node.hasChildren}
            item={node.data.notebook}
            isExpanded={expanded}
            rootId={rootId}
            totalNotes={node.data.totalNotes}
            refresh={async () => {
              const notebook = await db.notebooks.notebook(node.id);
              const totalNotes = await db.relations
                .from(node.data.notebook, "note")
                .count();
              treeRef.current?.refreshItem(
                index,
                notebook ? { notebook, totalNotes } : undefined
              );
            }}
            collapse={collapse}
            expand={expand}
          />
        )}
      /> */}
    </Flex>
  );
}
