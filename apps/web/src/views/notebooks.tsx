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

import { Notebook as NotebookType, VirtualizedGrouping } from "@notesnook/core";
import { Box, Input, Text } from "@theme-ui/components";
import { useEffect, useRef, useState } from "react";
import { db } from "../common/db";
import { store, useStore } from "../stores/notebook-store";
import { useStore as useSelectionStore } from "../stores/selection-store";
import { Notebook } from "../components/notebook";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../components/virtualized-tree";
import { ListLoader } from "../components/loaders/list-loader";
import { debounce } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { SidebarScroller } from "../components/sidebar-scroller";

export function Notebooks() {
  const roots = useStore((store) => store.notebooks);
  const [filteredNotebooks, setFilteredNotebooks] =
    useState<VirtualizedGrouping<NotebookType>>();
  const treeRef =
    useRef<
      VirtualizedTreeHandle<{ notebook: NotebookType; totalNotes: number }>
    >(null);
  const setSelectedItems = useSelectionStore((store) => store.setSelectedItems);
  const isSelected = useSelectionStore((store) => store.isSelected);
  const selectItem = useSelectionStore((store) => store.selectItem);
  const deselectItem = useSelectionStore((store) => store.deselectItem);
  const toggleSelection = useSelectionStore(
    (store) => store.toggleSelectionMode
  );
  const notebooks = filteredNotebooks || roots;

  useEffect(() => {
    store.get().refresh();
  }, []);

  useEffect(() => {
    treeRef.current?.resetAndRefresh();
  }, [filteredNotebooks]);

  useEffect(() => {
    treeRef.current?.refresh();
  }, [roots]);

  return (
    <>
      <Box
        id="notebooks"
        sx={{
          flex: 1,
          '[data-viewport-type="element"]': {
            px: 1,
            width: `calc(100% - ${2 * 6}px) !important`
          }
        }}
      >
        {!notebooks ? (
          <ListLoader />
        ) : notebooks.length === 0 ? (
          <Text
            variant="body"
            sx={{ color: "paragraph-secondary", mx: 1 }}
            data-test-id="list-placeholder"
          >
            {strings.notebooksEmpty()}
          </Text>
        ) : (
          <VirtualizedTree
            testId="notebooks-list"
            rootId={"root"}
            itemHeight={26}
            treeRef={treeRef}
            deselectAll={() => toggleSelection(false)}
            bulkSelect={setSelectedItems}
            isSelected={isSelected}
            onDeselect={deselectItem}
            onSelect={selectItem}
            saveKey="notebook-tree"
            getChildNodes={async (parent) => {
              const nodes: TreeNode<{
                notebook: NotebookType;
                totalNotes: number;
              }>[] = [];
              const grouping =
                parent.id === "root"
                  ? notebooks
                  : await db.relations
                      .from({ type: "notebook", id: parent.id }, "notebook")
                      .selector.sorted(
                        db.settings.getGroupOptions("notebooks")
                      );
              for (let i = 0; i < grouping.length; ++i) {
                const notebook = await grouping.item(i);
                if (!notebook.item) continue;
                nodes.push({
                  data: { notebook: notebook.item, totalNotes: 0 },
                  depth: parent.depth + 1,
                  hasChildren: false,
                  id: notebook.item.id,
                  parentId: parent.id
                });
              }
              const allRelations = await db.relations
                .from({ type: "notebook", ids: nodes.map((n) => n.id) }, [
                  "notebook",
                  "note"
                ])
                .get();
              for (const node of nodes) {
                node.hasChildren = allRelations.some(
                  (nb) => nb.fromId === node.id && nb.toType === "notebook"
                );
                node.data.totalNotes = allRelations.filter(
                  (nb) => nb.fromId === node.id && nb.toType === "note"
                ).length;
              }
              return nodes;
            }}
            renderItem={({ collapse, expand, expanded, index, item: node }) => (
              <Notebook
                key={node.id}
                depth={node.depth}
                isExpandable={node.hasChildren}
                item={node.data.notebook}
                isExpanded={expanded}
                totalNotes={node.data.totalNotes}
                refresh={async () => {
                  const notebook = await db.notebooks.notebook(node.id);
                  const totalNotes = await db.relations
                    .from(node.data.notebook, "note")
                    .count();
                  treeRef.current?.refreshItem(
                    index,
                    notebook ? { notebook, totalNotes } : undefined,
                    { expand: true }
                  );
                }}
                collapse={collapse}
                expand={expand}
              />
            )}
            Scroller={SidebarScroller}
          />
        )}
      </Box>
      <Input
        variant="clean"
        placeholder="Filter notebooks..."
        sx={{ borderTop: "1px solid var(--border)", mx: 0 }}
        onChange={debounce(async (e) => {
          const query = e.target.value.trim();
          setFilteredNotebooks(
            await (query ? db.lookup.notebooks(query).sorted() : undefined)
          );
        }, 300)}
      />
    </>
  );
}
