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

import { memo, useRef } from "react";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text } from "@ui";
import { CaretDown, Circle } from "../icons";
import { Section } from "../properties";
import {
  VirtualizedTree,
  type TreeNode,
  type VirtualizedTreeHandle
} from "../virtualized-tree";
import { useEditorManager, type TOCItem } from "./manager";

type TableOfContentsProps = {
  sessionId: string;
};

function TableOfContents(props: TableOfContentsProps) {
  const { sessionId } = props;
  const treeRef = useRef<VirtualizedTreeHandle<TOCItem>>(null);
  const tableOfContents = useEditorManager(
    (store) => store.editors[sessionId]?.tableOfContents
  );
  const headings = tableOfContents ?? [];

  return (
    <Section title={strings.toc()} sx={{ flex: 1, px: "spacing4" }}>
      <Flex
        testID="table-of-contents"
        sx={{ flexDirection: "column", flex: 1 }}
      >
        {headings.length <= 0 ? (
          <Text
            sx={{ color: "paragraph-secondary", fontSize: "xs" }}
            testID="table-of-contents-empty"
          >
            {strings.noHeadingsFound()}.
          </Text>
        ) : (
          <VirtualizedTree
            treeRef={treeRef}
            rootId="root"
            itemHeight={27}
            getChildNodes={async (parent) => {
              const remaining =
                parent.id === "root"
                  ? headings
                  : headings.slice(
                      headings.findIndex((item) => item.id === parent.id)
                    );
              const items: TOCItem[] = [];
              let added = false;
              for (let i = 0; i < remaining.length; i++) {
                if (added && parent.depth + 1 > remaining[i].level) break;
                items.push(remaining[i]);
                added = true;
              }
              const nodes: TreeNode<TOCItem>[] = [];
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.level !== parent.depth + 1) continue;
                nodes.push({
                  id: item.id,
                  data: item,
                  depth: parent.depth + 1,
                  parentId: parent.id,
                  hasChildren:
                    i + 1 < items.length && items[i + 1].level > item.level,
                  expanded: true
                });
              }
              return nodes;
            }}
            renderItem={({ item, collapse, expand, expanded }) => (
              <Button
                variant="menuitem"
                key={item.id}
                testID="toc-item"
                onPress={() =>
                  useEditorManager
                    .getState()
                    .getEditor(sessionId)
                    ?.editor?.scrollToHeading(item.id)
                }
                sx={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "spacing3",
                  width: "100%",
                  borderRadius: "radius1",
                  mb: "spacing1",
                  pl: item.depth === 0 ? 4 : 5 + 10 * item.depth,
                  pr: "spacing2",
                  py: "spacing2"
                }}
              >
                {item.hasChildren ? (
                  <Button
                    variant="secondary"
                    onPress={() => (expanded ? collapse() : expand())}
                    sx={{
                      bg: "transparent",
                      p: 0,
                      borderRadius: 100,
                      width: 14,
                      height: 14,
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <CaretDown
                      size={11}
                      color="icon"
                      sx={{
                        transform: [{ rotate: expanded ? "0deg" : "-90deg" }]
                      }}
                    />
                  </Button>
                ) : (
                  <Flex
                    sx={{
                      width: 14,
                      height: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <Circle size={5} color="icon" />
                  </Flex>
                )}
                <Text sx={{ fontSize: "xs", color: "paragraph" }}>
                  {item.data.title}
                </Text>
              </Button>
            )}
          />
        )}
      </Flex>
    </Section>
  );
}

export default memo(TableOfContents);
