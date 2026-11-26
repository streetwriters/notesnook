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

import { scrollIntoViewById, TOCItem } from "@notesnook/editor";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text } from "@theme-ui/components";
import React, { useLayoutEffect } from "react";
import { Circle, CaretDown } from "../icons";
import { Section } from "../properties";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../virtualized-tree";
import { useEditorManager } from "./manager";
import { Theme } from "@notesnook/theme";

type TableOfContentsProps = {
  sessionId: string;
};
function TableOfContents(props: TableOfContentsProps) {
  const { sessionId } = props;

  const treeRef = React.useRef<VirtualizedTreeHandle<TOCItem>>(null);
  const tableOfContents = useEditorManager(
    (store) => store.editors[sessionId]?.tableOfContents || []
  );

  useLayoutEffect(() => {
    treeRef.current?.refresh();
    const editorScroll = document.getElementById(`editorScroll_${sessionId}`);
    function onScroll() {
      const scrollTop = editorScroll?.scrollTop || 0;
      const height = editorScroll?.clientHeight || 0;
      for (let i = 0; i < tableOfContents.length; i++) {
        const toc = tableOfContents[i];
        const element = document.getElementById(`toc-${toc.id}`);
        if (!element) continue;

        const next = tableOfContents.at(i + 1);
        const viewport = scrollTop + height - 160;
        const lessThanNext = next ? scrollTop <= next.top : true;
        const isInViewport = toc.top <= viewport && toc.top >= scrollTop;
        const isActive = scrollTop >= toc.top && lessThanNext;

        element.classList.toggle("active", isActive || isInViewport);
      }
    }
    editorScroll?.addEventListener("scroll", onScroll);
    onScroll();
    return () => {
      editorScroll?.removeEventListener("scroll", onScroll);
    };
  }, [sessionId, tableOfContents]);

  return (
    <Section title={strings.toc()} sx={{ flex: 1, px: "spacing4" }}>
      <Flex
        sx={{
          flexDirection: "column",
          flex: 1
        }}
      >
        {tableOfContents.length <= 0 ? (
          <Text
            sx={{
              color: "paragraph-secondary",
              fontSize: "xs",
              lineHeight: "100%"
            }}
          >
            {strings.noHeadingsFound()}.
          </Text>
        ) : (
          <VirtualizedTree
            treeRef={treeRef}
            rootId="root"
            itemHeight={27}
            getChildNodes={async (parent) => {
              const remainingToc =
                parent.id === "root"
                  ? tableOfContents
                  : tableOfContents.slice(
                      tableOfContents.findIndex((item) => item.id === parent.id)
                    );

              const items: typeof remainingToc = [];
              let added = false;
              for (let i = 0; i < remainingToc.length; i++) {
                if (added && parent.depth + 1 > remainingToc[i].level) break;

                items.push(remainingToc[i]);
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
                id={`toc-${item.id}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "spacing3",
                  width: "100%",
                  textAlign: "left",
                  borderRadius: "radius1",
                  mb: "spacing1",
                  pl: (t) =>
                    `${
                      item.depth === 0
                        ? (t as Theme).space?.["spacing2"]
                        : 5 + 10 * item.depth
                    }px`,
                  pr: "spacing2",
                  py: "spacing2",
                  "&.active": {
                    color: "accent-selected",
                    bg: "background-selected"
                  },
                  "&.active path": {
                    fill: "var(--accent-selected) !important"
                  },
                  "&.active p": {
                    color: "paragraph-selected"
                  }
                }}
                onClick={() =>
                  scrollIntoViewById(item.id, "scroll-margin-top: 35px;")
                }
              >
                {item.hasChildren ? (
                  <Button
                    variant="secondary"
                    sx={{
                      bg: "transparent",
                      p: 0,
                      borderRadius: 100,
                      width: 14,
                      height: 14,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      expanded ? collapse() : expand();
                    }}
                  >
                    <CaretDown
                      size={11}
                      color="icon"
                      sx={{
                        transform: expanded ? "rotate(0deg)" : "rotate(-90deg)"
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
                <Text as="p" sx={{ fontSize: "xs", color: "paragraph" }}>
                  {item.data.title}
                </Text>
              </Button>
            )}
          ></VirtualizedTree>
        )}
      </Flex>
    </Section>
  );
}
export default React.memo(TableOfContents);
