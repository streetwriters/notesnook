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

import { memo, useState } from "react";
import type { HighlightedResult, Match as TMatch } from "@notesnook/core";
import { Button, Flex, Text, type MenuItem } from "@ui";
import ListItem from "../list-item";
import { ChevronDown, ChevronRight } from "../icons";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { noteMenuItems } from "../note";
import { db } from "../../common/db";

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
        onMiddleClick={() => {
          useEditorStore.getState().openSession(item.id, {
            openInNewTab: true,
            rawContent: item.rawContent
          });
        }}
        onPress={() => {
          useEditorStore.getState().openSession(item.id, {
            rawContent: item.rawContent,
            force: true
          });
        }}
        title={
          <Flex
            sx={{ flexDirection: "row", alignItems: "center", gap: "small" }}
          >
            {isExpandable && !isCompact ? (
              <Button
                testID="search-result-expand"
                variant="secondary"
                onPress={(event) => {
                  event.stopPropagation();
                  setIsExpanded((expanded) => !expanded);
                }}
                sx={{
                  bg: "transparent",
                  p: 0,
                  borderRadius: 100,
                  flexShrink: 0
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
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flex: 1
              }}
            >
              <Text
                testID="title"
                variant="body"
                numberOfLines={1}
                sx={{
                  color: isOpened ? "paragraph-selected" : "paragraph",
                  fontWeight: isCompact ? "bold" : 700
                }}
              >
                {item.title.map((match) => (
                  <Match key={match.id} match={match} />
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
        sx={{ my: "small", borderRadius: "default", mx: 1 }}
      />
      {isExpanded && !isCompact
        ? item.content.map((match, index) => (
            <ListItem
              key={`${item.id}${index}`}
              isFocused={false}
              item={item}
              menuItems={menuItems}
              onMiddleClick={() => {
                useEditorStore.getState().openSession(item.id, {
                  openInNewTab: true,
                  rawContent: item.rawContent,
                  activeSearchResultId: match[0].id
                });
              }}
              onPress={() => {
                useEditorStore.getState().openSession(item.id, {
                  rawContent: item.rawContent,
                  force: true,
                  activeSearchResultId: match[0].id
                });
              }}
              title={
                <Text
                  testID="title"
                  variant="body"
                  sx={{
                    color: isOpened ? "paragraph-selected" : "paragraph",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {match.map((part) => (
                    <Match key={part.id} match={part} />
                  ))}
                </Text>
              }
              sx={{
                px: 1,
                borderBottom: "1px solid",
                borderBottomColor: "border",
                mx: 1
              }}
            />
          ))
        : null}
    </Flex>
  );
}

export default memo(SearchResult);

function Match({ match }: { match: TMatch }) {
  return (
    <>
      <Text>{match.prefix}</Text>
      <Text
        sx={{
          bg: "accent-secondary",
          color: "accentForeground-secondary"
        }}
      >
        {match.match}
      </Text>
      {match.suffix ? <Text>{match.suffix}</Text> : null}
    </>
  );
}

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
