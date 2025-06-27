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

import { HighlightedResult } from "@notesnook/core";
import { Button, Flex, Text } from "@theme-ui/components";
import React, { useState } from "react";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import ListItem from "../list-item";
import { ChevronDown, ChevronRight } from "../icons";
import { noteMenuItems } from "../note";
import { db } from "../../common/db";
import { MenuItem } from "@notesnook/ui";

type SearchResultProps = {
  item: HighlightedResult;
};

function SearchResult(props: SearchResultProps) {
  const { item } = props;

  const isOpened = useEditorStore((store) => store.isNoteOpen(item.id));
  const isExpandable = item.content.length > 0;
  const [isExpanded, setIsExpanded] = useState(isExpandable);
  const isCompact = useNoteStore((store) => store.viewMode === "compact");

  if (!item.title.length && !item.content.length) return null;
  return (
    <Flex sx={{ flexDirection: "column" }}>
      <ListItem
        isFocused={isOpened}
        item={item}
        menuItems={menuItems}
        onClick={() => {
          useEditorStore.getState().openSession(item.id, {
            rawContent: item.rawContent,
            force: true
          });
        }}
        onMiddleClick={() => {
          useEditorStore.getState().openSession(item.id, {
            openInNewTab: true,
            rawContent: item.rawContent
          });
        }}
        title={
          <Flex sx={{ alignItems: "center", gap: "small" }}>
            {isExpandable && !isCompact ? (
              <Button
                variant="secondary"
                sx={{
                  bg: "transparent",
                  p: 0,
                  borderRadius: 100,
                  flexShrink: 0
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((s) => !s);
                }}
              >
                {isExpanded ? (
                  <ChevronDown
                    size={14}
                    color={isOpened ? "icon-selected" : "icon"}
                  />
                ) : (
                  <ChevronRight
                    size={14}
                    color={isOpened ? "icon-selected" : "icon"}
                  />
                )}
              </Button>
            ) : null}
            <Flex
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                flex: 1
              }}
            >
              <Text
                data-test-id={`title`}
                variant={"body"}
                color={isOpened ? "paragraph-selected" : "paragraph"}
                sx={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontWeight: isCompact ? "bold" : "bolder",
                  display: "block",
                  ".match": {
                    bg: "accent-secondary",
                    color: "accentForeground-secondary"
                  }
                }}
              >
                {item.title.map((match) => (
                  <>
                    <span>{match.prefix}</span>
                    <span className="match">{match.match}</span>
                    {match.suffix ? <span>{match.suffix}</span> : null}
                  </>
                ))}
              </Text>

              <Text variant="subBody">
                {item.content?.reduce(
                  (count, next) => next.length + count,
                  0
                ) || 0}
              </Text>
            </Flex>
          </Flex>
        }
        sx={{
          my: "small",
          borderRadius: "default",
          mx: 1
        }}
      />
      {isExpanded && !isCompact
        ? item.content.map((match, index) => (
            <ListItem
              key={`${item.id}${index}`}
              isFocused={false}
              item={item}
              menuItems={menuItems}
              onClick={() => {
                useEditorStore.getState().openSession(item.id, {
                  rawContent: item.rawContent,
                  force: true,
                  activeSearchResultIndex: findSelectedMatchIndex(item, index)
                });
              }}
              onMiddleClick={() => {
                useEditorStore.getState().openSession(item.id, {
                  openInNewTab: true,
                  rawContent: item.rawContent,
                  activeSearchResultIndex: findSelectedMatchIndex(item, index)
                });
              }}
              title={
                <Text
                  data-test-id={`title`}
                  variant={"body"}
                  color={isOpened ? "paragraph-selected" : "paragraph"}
                  sx={{
                    whiteSpace: "pre-wrap",
                    display: "block",
                    ".match": {
                      bg: "accent-secondary",
                      color: "accentForeground-secondary"
                    }
                  }}
                >
                  {match.map((match) => (
                    <>
                      <span>{match.prefix}</span>
                      <span className="match">{match.match}</span>
                      {match.suffix ? <span>{match.suffix}</span> : null}
                    </>
                  ))}
                </Text>
              }
              sx={{
                px: 1,
                borderBottom: "1px solid var(--border)",
                mx: 1
              }}
            />
          ))
        : null}
    </Flex>
  );
}

export default React.memo(SearchResult);

async function menuItems(
  item: HighlightedResult,
  ids?: string[]
): Promise<MenuItem[]> {
  const note = await db.notes.note(item.id);
  if (!note) return [];

  const colors = await db.relations
    .to({ type: "note", id: item.id }, "color")
    .resolve();
  return noteMenuItems(note, ids, {
    locked: !!(
      await db
        .sql()
        .selectFrom("content")
        .where("noteId", "in", [note.id])
        .select(["noteId", "locked"])
        .executeTakeFirst()
    )?.locked,
    color: colors[0]
  });
}

function findSelectedMatchIndex(item: HighlightedResult, matchIndex: number) {
  let activeIndex = 0;
  for (let i = 0; i <= matchIndex - 1; ++i) {
    activeIndex += item.content[i].length;
  }
  return activeIndex;
}
