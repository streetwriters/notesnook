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

import React, { useEffect, useState } from "react";
import { Cross } from "../icons";
import { useEditorStore } from "../../stores/editor-store";
import ScrollContainer from "../scroll-container";
import { ScopedThemeProvider } from "../theme-provider";
import { Section } from "../properties";
import { scrollIntoViewById } from "@notesnook/editor";
import { Button, Flex, Text } from "@theme-ui/components";
import { useEditorManager } from "./manager";
import { TITLE_BAR_HEIGHT } from "../title-bar";
import { strings } from "@notesnook/intl";

type TableOfContentsProps = {
  sessionId: string;
};
function TableOfContents(props: TableOfContentsProps) {
  const { sessionId } = props;

  const [active, setActive] = useState<string[]>([]);
  const toggleTableOfContents = useEditorStore(
    (store) => store.toggleTableOfContents
  );
  const tableOfContents = useEditorManager(
    (store) => store.editors[sessionId]?.tableOfContents || []
  );

  useEffect(() => {
    const editorScroll = document.getElementById(`editorScroll_${sessionId}`);
    if (!editorScroll) return;
    function onScroll() {
      const scrollTop = editorScroll?.scrollTop || 0;
      const height = editorScroll?.clientHeight || 0;
      const active = tableOfContents.filter((t, i, array) => {
        const next = array.at(i + 1);
        const viewport = scrollTop + height - 160;
        const lessThanNext = next ? scrollTop <= next.top : true;
        const isInViewport = t.top <= viewport && t.top >= scrollTop;
        const isActive = scrollTop >= t.top && lessThanNext;
        return isInViewport || isActive;
      });
      setActive(active.map((a) => a.id));
    }
    editorScroll.addEventListener("scroll", onScroll);
    onScroll();
    return () => {
      editorScroll.removeEventListener("scroll", onScroll);
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
        <ScrollContainer>
          <Section
            title={strings.toc()}
            buttonPosition="right"
            button={
              <Cross
                data-test-id="toc-close"
                onClick={() => toggleTableOfContents(false)}
                size={18}
                sx={{ mr: 1, cursor: "pointer" }}
              />
            }
          >
            <Flex sx={{ mt: 2, flexDirection: "column" }}>
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
                tableOfContents.map((t) => (
                  <Button
                    variant="menuitem"
                    key={t.id}
                    sx={{
                      textAlign: "left",
                      paddingLeft: `${t.level * 10 + (t.level - 1) * 10}px`,
                      py: 1,
                      pr: 1,
                      borderLeft: "5px solid transparent",
                      borderColor: active.includes(t.id)
                        ? "accent-selected"
                        : "transparent",
                      color: active.includes(t.id)
                        ? "accent-selected"
                        : "paragraph"
                    }}
                    onClick={() => scrollIntoViewById(t.id)}
                  >
                    {t.title}
                  </Button>
                ))
              )}
            </Flex>
          </Section>
        </ScrollContainer>
      </ScopedThemeProvider>
    </Flex>
  );
}
export default React.memo(TableOfContents);
