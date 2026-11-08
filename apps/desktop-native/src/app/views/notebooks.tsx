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

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Notebook as NotebookType,
  VirtualizedGrouping
} from "@notesnook/core";
import { debounce } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { Box, Flex } from "@ui";
import { db } from "../common/db";
import { store, useStore } from "../stores/notebook-store";
import { store as selectionStore } from "../stores/selection-store";
import { Notebook } from "../components/notebook";
import {
  VirtualizedTree,
  type TreeNode,
  type VirtualizedTreeHandle
} from "../components/virtualized-tree";
import { ListLoader } from "../components/loaders/list-loader";
import { SidebarPlaceholder } from "../components/placeholders";
import { FilterField } from "../components/navigation-menu/filter-field";

type NotebookNodeData = { notebook: NotebookType; totalNotes: number };

export function Notebooks() {
  const roots = useStore((store) => store.notebooks);
  const [filtered, setFiltered] = useState<VirtualizedGrouping<NotebookType>>();
  const query = useRef("");
  const treeRef = useRef<VirtualizedTreeHandle<NotebookNodeData>>(null);
  const notebooks = filtered || roots;

  useEffect(() => {
    store.get().refresh();
  }, []);

  useEffect(() => {
    treeRef.current?.resetAndRefresh();
  }, [filtered]);

  useEffect(() => {
    treeRef.current?.refresh();
    if (!query.current) return;
    (async () => {
      setFiltered(await db.lookup.notebooks(query.current).sorted());
    })();
  }, [roots]);

  const onFilter = useMemo(
    () =>
      debounce(async (text: string) => {
        query.current = text.trim();
        setFiltered(
          await (query.current
            ? db.lookup.notebooks(query.current).sorted()
            : undefined)
        );
      }, 300),
    []
  );

  const getChildNodes = useMemo(
    () => async (parent: TreeNode<NotebookNodeData>) => {
      if (!notebooks) return [];
      const nodes: TreeNode<NotebookNodeData>[] = [];
      const grouping =
        parent.id === "root"
          ? notebooks
          : await db.relations
              .from({ type: "notebook", id: parent.id }, "notebook")
              .selector.sorted(db.settings.getGroupOptions("notebooks"));
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
          (relation) =>
            relation.fromId === node.id && relation.toType === "notebook"
        );
        node.data.totalNotes = allRelations.filter(
          (relation) =>
            relation.fromId === node.id && relation.toType === "note"
        ).length;
      }
      return nodes;
    },
    [notebooks]
  );

  return (
    <>
      <Box sx={{ flex: 1, mt: "spacing4" }}>
        {!notebooks ? (
          <ListLoader />
        ) : notebooks.length === 0 ? (
          <Flex
            sx={{
              justifyContent: "center",
              alignItems: "center",
              height: "100%"
            }}
          >
            <SidebarPlaceholder variant="notebooks" />
          </Flex>
        ) : (
          <Flex testID="notebooks-list" sx={{ flex: 1, px: "spacing4" }}>
            <VirtualizedTree
              rootId="root"
              itemHeight={33}
              treeRef={treeRef}
              saveKey="notebook-tree"
              deselectAll={() => selectionStore.toggleSelectionMode(false)}
              bulkSelect={selectionStore.setSelectedItems}
              isSelected={selectionStore.isSelected}
              onDeselect={selectionStore.deselectItem}
              onSelect={selectionStore.selectItem}
              getChildNodes={getChildNodes}
              renderItem={({
                collapse,
                expand,
                expanded,
                item: node,
                index,
                select
              }) => (
                <Notebook
                  key={node.id}
                  index={index}
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
                  select={select}
                />
              )}
            />
          </Flex>
        )}
      </Box>
      <FilterField
        placeholder={strings.filterNotebooks()}
        onChangeText={onFilter}
      />
    </>
  );
}
