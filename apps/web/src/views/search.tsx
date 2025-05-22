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

import { HighlightedResult, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Text } from "@theme-ui/components";
import GroupHeader from "../components/group-header";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../components/virtualized-tree";
import { useEffect, useRef } from "react";
import SearchResult from "../components/search-result";

type NotesProps = {
  items: VirtualizedGrouping<HighlightedResult>;
  refresh: () => void;
};
function Search(props: NotesProps) {
  const { items, refresh } = props;
  const treeRef = useRef<
    VirtualizedTreeHandle<{
      item: HighlightedResult;
      matchIndex?: number;
    }>
  >(null);

  useEffect(() => {
    treeRef.current?.resetAndRefresh();
  }, [items]);

  return (
    <>
      {items.length === 0 ? (
        <Text
          variant="body"
          sx={{ color: "paragraph-secondary", mx: 1 }}
          data-test-id="list-placeholder"
        >
          {strings.noResultsFound()}
        </Text>
      ) : (
        <>
          <GroupHeader
            groupingKey={"search"}
            isSearching={true}
            refresh={refresh}
            title={`${items.length} results`}
            isFocused={false}
            index={0}
            onSelectGroup={() => {}}
            groups={async () => []}
            onJump={() => {}}
          />
          <VirtualizedTree
            treeRef={treeRef}
            testId="search-results-list"
            rootId={"root"}
            getChildNodes={async (parent) => {
              const nodes: TreeNode<{
                item: HighlightedResult;
                matchIndex?: number;
              }>[] = [];
              if (parent.id === "root") {
                for (let i = 0; i < items.length; ++i) {
                  const result = await items.item(i);
                  if (!result.item) continue;
                  nodes.push({
                    data: { item: result.item },
                    depth: parent.depth + 1,
                    hasChildren: !!result.item.content?.length,
                    id: result.item.id,
                    parentId: parent.id,
                    expanded: true
                  });
                }
              } else {
                for (
                  let i = 0;
                  i < (parent.data.item.content.length || 0);
                  ++i
                ) {
                  nodes.push({
                    data: { item: parent.data.item, matchIndex: i },
                    depth: parent.depth + 1,
                    parentId: parent.id,
                    id: parent.id + i,
                    hasChildren: false
                  });
                }
              }
              return nodes;
            }}
            renderItem={({ collapse, expand, expanded, item: node }) => (
              <SearchResult
                key={node.id}
                depth={node.depth}
                isExpandable={node.hasChildren}
                item={node.data.item}
                matchIndex={node.data.matchIndex}
                isExpanded={expanded}
                collapse={collapse}
                expand={expand}
              />
            )}
          />
        </>
      )}
    </>
  );
}
export default Search;
