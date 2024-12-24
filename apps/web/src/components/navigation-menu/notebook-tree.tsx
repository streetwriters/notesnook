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

import { Notebook } from "@notesnook/core";
import { Button, Flex } from "@theme-ui/components";
import { useEffect, useRef, useState } from "react";
import { CREATE_BUTTON_MAP } from "../../common";
import { db } from "../../common/db";
import { store, useStore } from "../../stores/notebook-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import Placeholder from "../placeholders";
import SubNotebook from "../sub-notebook";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../virtualized-tree";
import { ListLoader } from "../loaders/list-loader";

function NotebookTree() {
  const notebooks = useStore((state) => state.notebooks);
  const createButton = CREATE_BUTTON_MAP.notebooks;

  useEffect(() => {
    store.get().refresh();
  }, []);

  if (!notebooks) return <ListLoader />;
  if (notebooks.length === 0) {
    return (
      <Flex variant="columnCenterFill" data-test-id="list-placeholder">
        <Placeholder context="notebooks" />
      </Flex>
    );
  }
  return (
    <Flex sx={{ gap: 2, flexDirection: "column", my: 1 }}>
      <Button variant="secondary" onClick={createButton.onClick}>
        {createButton.title}
      </Button>
      <div style={{ height: "100vh" }}>
        <Tree />
      </div>
    </Flex>
  );
}
export default NotebookTree;

function Tree() {
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
    treeRef.current?.refresh();
  }, [notebooks]);

  return (
    <Flex
      id="notebook-tree"
      variant="columnFill"
      sx={{
        height: "100%"
      }}
    >
      {notebookIds.length > 0 && (
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
            const nodes: TreeNode<{
              notebook: Notebook;
              totalNotes: number;
            }>[] = [];
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
        />
      )}
    </Flex>
  );
}
