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

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { usePersistentState } from "../../hooks/use-persistent-state";
import {
  Components,
  ItemProps,
  Virtuoso,
  VirtuosoHandle
} from "react-virtuoso";
import { useKeyboardListNavigation } from "../../hooks/use-keyboard-list-navigation";
import { CustomScrollbarsVirtualList, waitForElement } from "../list-container";

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
  treeRef?: React.Ref<VirtualizedTreeHandle<T>> | null;
  rootId: string;
  itemHeight?: number;
  getChildNodes: (parent: TreeNode<T>) => Promise<TreeNode<T>[]>;
  renderItem: (props: {
    item: TreeNode<T>;
    index: number;
    expanded: boolean;
    expand: () => void;
    collapse: () => void;
  }) => React.ReactNode;
  saveKey?: string;

  testId?: string;
  placeholder?: () => React.ReactNode;
  onSelect?: (id: string) => void;
  onDeselect?: (id: string) => void;
  bulkSelect?: (ids: string[]) => void;
  deselectAll?: () => void;
  isSelected?: (id: string) => boolean;
  style?: React.CSSProperties;

  Scroller?: Components["Scroller"];
};
export function VirtualizedTree<T>(props: TreeViewProps<T>) {
  const {
    rootId,
    itemHeight,
    renderItem: Node,
    getChildNodes,
    treeRef,
    saveKey,

    placeholder: Placeholder,
    isSelected,
    onDeselect,
    onSelect,
    deselectAll,
    bulkSelect,
    testId,
    Scroller
  } = props;
  const [nodes, setNodes] = useState<TreeNode<T>[]>([]);
  const [expandedIds, setExpandedIds] = usePersistentState<ExpandedIds>(
    saveKey,
    {}
  );
  const list = useRef<VirtuosoHandle>(null);

  useImperativeHandle(
    treeRef,
    () => ({
      async refresh() {
        const { children } = await fetchChildren(
          { id: rootId, depth: -1, data: {} as T, hasChildren: true },
          expandedIds,
          getChildNodes
        );
        setNodes(children);
        setExpandedIds(expandedIds);
      },
      async resetAndRefresh() {
        setNodes([]);
        await this.refresh();
      },
      async refreshItem(index, item, itemOptions) {
        const node = nodes[index];
        const removeIds: string[] = [node.id];
        for (const treeNode of nodes) {
          if (treeNode.parentId && removeIds.includes(treeNode.parentId)) {
            removeIds.push(treeNode.id);
          }
        }

        const filtered = nodes.filter((n) => !removeIds.includes(n.id));
        if (!item) {
          setNodes(filtered);
          return;
        }

        const childNodes = await getChildNodes(node);
        if (childNodes.length > 0 && itemOptions?.expand) {
          expandedIds[node.id] = true;
        }

        const { children } = await fetchChildren(
          node,
          expandedIds,
          getChildNodes
        );

        const hasChildren = children.length > 0;

        filtered.splice(
          index,
          0,
          {
            id: node.id,
            data: item,
            depth: node.depth,
            hasChildren: hasChildren,
            parentId: node.parentId
          },
          ...children
        );
        setExpandedIds(expandedIds);
        setNodes(filtered);
      }
    }),
    [expandedIds, getChildNodes, nodes, rootId]
  );

  const { onMouseUp, onKeyDown } = useKeyboardListNavigation({
    length: nodes.length,
    reset: () => deselectAll?.(),
    deselect: (index) => {
      const id = nodes[index].id;
      if (!id) return;
      onDeselect?.(id);
    },
    select: (index, toggleable) => {
      const id = nodes[index].id;
      if (!id) return;
      if (toggleable && isSelected?.(id)) onDeselect?.(id);
      else onSelect?.(id);
    },
    bulkSelect: (indices) => {
      const ids =
        indices.length === nodes.length
          ? nodes.map((c) => c.id)
          : (indices.map((i) => nodes[i].id).filter(Boolean) as string[]);
      bulkSelect?.(ids);
    },
    focusItemAt: (index) => {
      const id = nodes[index].id;
      if (!id || !list.current) return;

      waitForElement(list.current, index, `id_${id}`, (element) =>
        element.focus()
      );
    },
    skip: () => false,
    open: (index) => {
      const id = nodes[index].id;
      if (!id || !list.current) return;

      waitForElement(list.current, index, `id_${id}`, (element) =>
        element.click()
      );
    }
  });

  useEffect(() => {
    fetchChildren(
      { depth: -1, id: rootId, data: {} as T, hasChildren: true },
      expandedIds,
      getChildNodes
    ).then(({ children, expandedIds }) => {
      setNodes(children);
      setExpandedIds(expandedIds);
    });
    console.log("fetching");
  }, [rootId]);

  return (
    <Virtuoso
      data-test-id={testId}
      ref={list}
      totalCount={nodes.length}
      computeItemKey={(i) => nodes[i].id}
      fixedItemHeight={itemHeight}
      onKeyDown={(e) => onKeyDown(e.nativeEvent)}
      context={{
        onMouseUp
      }}
      components={{
        Scroller: (Scroller as any) || CustomScrollbarsVirtualList,
        Item: VirtuosoItem,
        EmptyPlaceholder: Placeholder
      }}
      itemContent={(index) => {
        const node = nodes[index];
        return (
          <Node
            item={node}
            index={index}
            expanded={expandedIds[node.id]}
            collapse={() => {
              if (!expandedIds[node.id]) return;

              const expanded = { ...expandedIds, [node.id]: false };
              setNodes((tree) => {
                const removeIds: string[] = [];
                for (const treeNode of tree) {
                  if (
                    treeNode.parentId &&
                    (treeNode.parentId === node.id ||
                      removeIds.includes(treeNode.parentId))
                  ) {
                    removeIds.push(treeNode.id);
                  }
                }
                return tree.filter((n) => !removeIds.includes(n.id));
              });
              setExpandedIds(expanded);
            }}
            expand={async () => {
              if (expandedIds[node.id]) return;

              const { children } = await fetchChildren(
                node,
                expandedIds,
                getChildNodes
              );
              setExpandedIds({ ...expandedIds, [node.id]: true });
              setNodes((tree) => {
                const copy = tree.slice();
                copy.splice(index + 1, 0, ...children);
                return copy;
              });
            }}
          />
        );
      }}
    />
  );
}

type ListContext = {
  onMouseUp: (e: MouseEvent, index: number) => void;
};
function VirtuosoItem({
  item: _item,
  context,
  ...props
}: ItemProps<TreeNode> & {
  context?: ListContext;
}) {
  return (
    <div
      {...props}
      onMouseUp={(e) =>
        context?.onMouseUp(e.nativeEvent, props["data-item-index"])
      }
    >
      {props.children}
    </div>
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
