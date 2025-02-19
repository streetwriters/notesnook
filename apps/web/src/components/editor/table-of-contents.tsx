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

import React, { useEffect, useLayoutEffect, useState } from "react";
import { ChevronDown, ChevronRight, Circle, Cross } from "../icons";
import { useEditorStore } from "../../stores/editor-store";
import ScrollContainer from "../scroll-container";
import { ScopedThemeProvider } from "../theme-provider";
import { Section } from "../properties";
import { scrollIntoViewById, TOCItem } from "@notesnook/editor";
import { Button, Flex, Text } from "@theme-ui/components";
import { useEditorManager } from "./manager";
import { TITLE_BAR_HEIGHT } from "../title-bar";
import { strings } from "@notesnook/intl";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../virtualized-tree";

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
    <Flex
      sx={{
        display: "flex",
        top: TITLE_BAR_HEIGHT,
        zIndex: 999,
        height: "100%",
        borderLeft: "1px solid",
        borderLeftColor: "border"
      }}
    >
      <ScopedThemeProvider
        scope="editorSidebar"
        sx={{
          flex: 1,
          display: "flex",
          bg: "background",
          overflowY: "hidden",
          overflowX: "hidden",
          flexDirection: "column"
        }}
      >
        <Section title={strings.toc()} sx={{ flex: 1 }}>
          <Flex
            sx={{
              mt: 1,
              flexDirection: "column",
              mx: 1,
              flex: 1
            }}
          >
            {tableOfContents.length <= 0 ? (
              <Text
                variant="body"
                sx={{
                  pl: 1
                }}
              >
                {strings.noHeadingsFound()}.
              </Text>
            ) : (
              <VirtualizedTree
                treeRef={treeRef}
                rootId="root"
                itemHeight={27}
                getChildNodes={async (id, depth) => {
                  const nodes: TreeNode<TOCItem>[] = [];
                  for (let i = 0; i < tableOfContents.length; i++) {
                    const item = tableOfContents[i];
                    if (item.level !== depth + 1) continue;
                    nodes.push({
                      id: item.id,
                      data: item,
                      depth: depth + 1,
                      parentId: id,
                      hasChildren:
                        i + 1 < tableOfContents.length &&
                        tableOfContents[i + 1].level > item.level,
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
                      gap: 1,
                      width: "100%",
                      textAlign: "left",
                      borderRadius: "default",
                      marginLeft: `${
                        item.depth === 0 ? 0 : 5 + 10 * item.depth
                      }px`,
                      px: 1,
                      py: 1,
                      "&.active": {
                        color: "accent-selected"
                      },
                      "&.active path": {
                        fill: "var(--accent-selected) !important"
                      }
                    }}
                    onClick={() =>
                      scrollIntoViewById(item.id, "scroll-margin-top: 35px;")
                    }
                  >
                    {item.hasChildren ? (
                      <Button
                        variant="secondary"
                        sx={{ bg: "transparent", p: 0, borderRadius: 100 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          expanded ? collapse() : expand();
                        }}
                      >
                        {expanded ? (
                          <ChevronDown size={14} color="icon-secondary" />
                        ) : (
                          <ChevronRight size={14} color="icon-secondary" />
                        )}
                      </Button>
                    ) : (
                      <Circle size={5} color="icon-secondary" />
                    )}
                    {item.data.title}
                  </Button>
                )}
              ></VirtualizedTree>
            )}
          </Flex>
        </Section>
      </ScopedThemeProvider>
    </Flex>
  );
}
export default React.memo(TableOfContents);
