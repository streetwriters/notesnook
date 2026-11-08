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

import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref
} from "react";
import { VirtualList } from "@ui";
import { usePersistentState } from "../../hooks/use-persistent-state";

export type VirtualizedTreeHandle<T> = {
  refresh: () => void;
  resetAndRefresh: () => void;
  refreshItem: (
    index: number,
    item?: T,
    itemOptions?: { expand?: boolean }
  ) => void;
};
export type TreeNode<T = any> = {
  id: string;
  parentId?: string;
  depth: number;
  hasChildren: boolean;
  data: T;
  expanded?: boolean;
};
type ExpandedIds = Record<string, boolean>;
type TreeViewProps<T> = {
  treeRef?: Ref<VirtualizedTreeHandle<T>> | null;
  rootId: string;
  itemHeight?: number;
  itemGap?: number;
  getChildNodes: (parent: TreeNode<T>) => Promise<TreeNode<T>[]>;
  renderItem: (props: {
    item: TreeNode<T>;
    index: number;
    expanded: boolean;
    expand: () => void;
    collapse: () => void;
  }) => ReactNode;
  saveKey?: string;
  testID?: string;
};

export function VirtualizedTree<T>(props: TreeViewProps<T>) {
  const {
    rootId,
    itemHeight = 33,
    itemGap = 0,
    renderItem: Node,
    getChildNodes,
    treeRef,
    saveKey,
    testID
  } = props;
  const [nodes, setNodes] = useState<TreeNode<T>[]>([]);
  const [expandedIds, setPersistedIds] = usePersistentState<ExpandedIds>(
    saveKey,
    {}
  );
  const expandedRef = useRef(expandedIds);
  const setExpandedIds = (next: ExpandedIds) => {
    expandedRef.current = next;
    setPersistedIds(next);
  };

  useImperativeHandle(
    treeRef,
    () => ({
      async refresh() {
        const { children } = await fetchChildren(
          { id: rootId, depth: -1, data: {} as T, hasChildren: true },
          expandedRef.current,
          getChildNodes
        );
        setNodes(children);
        setExpandedIds({ ...expandedRef.current });
      },
      async resetAndRefresh() {
        setNodes([]);
        await this.refresh();
      },
      async refreshItem(index, item, itemOptions) {
        const node = nodes[index];
        const removeIds: string[] = [node.id];
        for (const treeNode of nodes) {
          if (treeNode.parentId && removeIds.includes(treeNode.parentId))
            removeIds.push(treeNode.id);
        }

        const filtered = nodes.filter((n) => !removeIds.includes(n.id));
        if (!item) {
          setNodes(filtered);
          return;
        }

        const childNodes = await getChildNodes(node);
        if (childNodes.length > 0 && itemOptions?.expand)
          expandedRef.current[node.id] = true;

        const { children } = await fetchChildren(
          node,
          expandedRef.current,
          getChildNodes
        );

        filtered.splice(
          index,
          0,
          {
            id: node.id,
            data: item,
            depth: node.depth,
            hasChildren: children.length > 0,
            parentId: node.parentId
          },
          ...children
        );
        setExpandedIds({ ...expandedRef.current });
        setNodes(filtered);
      }
    }),
    [expandedIds, getChildNodes, nodes, rootId, setExpandedIds]
  );

  useEffect(() => {
    fetchChildren(
      { depth: -1, id: rootId, data: {} as T, hasChildren: true },
      expandedRef.current,
      getChildNodes
    ).then(({ children, expandedIds }) => {
      setNodes(children);
      setExpandedIds({ ...expandedIds });
    });
  }, [rootId]);

  const extraData = useMemo(
    () => ({ nodes, expandedIds }),
    [nodes, expandedIds]
  );

  return (
    <VirtualList
      testID={testID}
      count={nodes.length}
      itemKey={(index) => nodes[index]?.id ?? `${index}`}
      estimatedItemSize={itemHeight + itemGap}
      extraData={extraData}
      renderItem={(index) => {
        const node = nodes[index];
        if (!node) return null;
        return (
          <Node
            item={node}
            index={index}
            expanded={nodes[index + 1]?.parentId === node.id}
            collapse={() => {
              setExpandedIds({ ...expandedRef.current, [node.id]: false });
              setNodes((tree) => {
                const removeIds: string[] = [];
                for (const treeNode of tree) {
                  if (
                    treeNode.parentId &&
                    (treeNode.parentId === node.id ||
                      removeIds.includes(treeNode.parentId))
                  )
                    removeIds.push(treeNode.id);
                }
                return tree.filter((n) => !removeIds.includes(n.id));
              });
            }}
            expand={async () => {
              const { children } = await fetchChildren(
                node,
                expandedRef.current,
                getChildNodes
              );
              setExpandedIds({ ...expandedRef.current, [node.id]: true });
              setNodes((tree) => {
                if (tree.some((n) => n.parentId === node.id)) return tree;
                const copy = tree.slice();
                const at = copy.findIndex((n) => n.id === node.id);
                copy.splice(at + 1, 0, ...children);
                return copy;
              });
            }}
          />
        );
      }}
    />
  );
}

async function fetchChildren<T>(
  node: TreeNode<T>,
  expandedIds: ExpandedIds,
  getChildNodes: TreeViewProps<T>["getChildNodes"]
) {
  const children = await getChildNodes(node);
  for (let i = 0; i < children.length; i++) {
    const childNode = children[i];
    if (
      expandedIds[childNode.id] ||
      (expandedIds[childNode.id] === undefined &&
        childNode.expanded &&
        childNode.hasChildren)
    ) {
      expandedIds[childNode.id] = true;
      const { children: nodes } = await fetchChildren(
        childNode,
        expandedIds,
        getChildNodes
      );
      children.splice(i + 1, 0, ...nodes);
      i += nodes.length;
    }
  }
  return { children, expandedIds };
}
