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

import React, { useEffect, useRef } from "react";
import { useStore } from "../stores/note-store";
import ListContainer from "../components/list-container";
import useNavigate from "../hooks/use-navigate";
import Placeholder from "../components/placeholders";
import { useSearch } from "../hooks/use-search";
import { db } from "../common/db";
import { useEditorStore } from "../stores/editor-store";
import { ListLoader } from "../components/loaders/list-loader";
import { Box, Text } from "@theme-ui/components";
import { strings } from "@notesnook/intl";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../components/virtualized-tree";
import SearchResult from "../components/search-result";
import { HighlightedResult, Match } from "@notesnook/core";
import GroupHeader from "../components/group-header";

function Home() {
  const treeRef = useRef<
    VirtualizedTreeHandle<{
      item: HighlightedResult;
      matchIndex?: number;
    }>
  >(null);
  const notes = useStore((store) => store.notes);
  const isCompact = useStore((store) => store.viewMode === "compact");
  const refresh = useStore((store) => store.refresh);
  const setContext = useStore((store) => store.setContext);
  const filteredItems = useSearch(
    "notes",
    async (query, sortOptions) => {
      if (useStore.getState().context) return;
      return await db.lookup.notes(query, sortOptions);
    },
    [notes]
  );

  useNavigate("home", setContext);

  useEffect(() => {
    useStore.getState().refresh();
  }, []);

  useEffect(() => {
    treeRef.current?.resetAndRefresh();
  }, [filteredItems]);

  // useEffect(() => {
  //   (async function () {

  //     // const titles =
  //     //   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
  //     // for (let i = 0; i < 10000; ++i) {
  //     //   await db.notes.add({
  //     //     title: `${
  //     //       titles[getRandom(0, titles.length)]
  //     //     } Some other title of mine`
  //     //   });
  //     //   if (i % 100 === 0) console.log(i);
  //     // }
  //     // console.log("DONE");
  //   })();
  // }, []);

  if (filteredItems) {
    return (
      <>
        {filteredItems.length === 0 ? (
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
              title={`${filteredItems.length} results`}
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
                  for (let i = 0; i < filteredItems.length; ++i) {
                    const result = await filteredItems.item(i);
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

  if (!notes) return <ListLoader />;
  return (
    <ListContainer
      type="home"
      group="home"
      compact={isCompact}
      refresh={refresh}
      items={filteredItems || notes}
      placeholder={<Placeholder context={filteredItems ? "search" : "notes"} />}
      button={{
        onClick: () => useEditorStore.getState().newSession()
      }}
    />
  );
}
export default React.memo(Home, () => true);
