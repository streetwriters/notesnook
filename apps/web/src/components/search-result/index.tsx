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
import React from "react";
import { useEditorStore } from "../../stores/editor-store";

import ListItem from "../list-item";
import { ChevronDown, ChevronRight } from "../icons";
import { noteMenuItems } from "../note";
import { db } from "../../common/db";

type SearchResultProps = {
  item: HighlightedResult;
  matchIndex?: number;
  depth: number;
  isExpandable: boolean;
  isExpanded: boolean;
  collapse: () => void;
  expand: () => void;
};

function SearchResult(props: SearchResultProps) {
  const { item, matchIndex, collapse, expand, isExpandable, isExpanded } =
    props;

  const isOpened = useEditorStore((store) => store.isNoteOpen(item.id));
  const match = matchIndex !== undefined ? item.content[matchIndex] : undefined;

  return (
    <ListItem
      isFocused={match ? false : isOpened}
      isCompact={!match}
      item={item}
      menuItems={async (item, ids) => {
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
      }}
      onClick={() => {
        useEditorStore.getState().openSession(item.id, {
          rawContent: item.rawContent,
          force: true,
          activeSearchResultIndex: findSelectedMatchIndex(item, matchIndex || 0)
        });
      }}
      onMiddleClick={() => {
        useEditorStore.getState().openSession(item.id, {
          openInNewTab: true,
          rawContent: item.rawContent,
          activeSearchResultIndex: findSelectedMatchIndex(item, matchIndex || 0)
        });
      }}
      title={
        <Flex sx={{ alignItems: "center", gap: "small" }}>
          {isExpandable ? (
            <Button
              variant="secondary"
              sx={{ bg: "transparent", p: 0, borderRadius: 100 }}
              onClick={(e) => {
                e.stopPropagation();
                isExpanded ? collapse() : expand();
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
          <Text
            data-test-id={`title`}
            variant={"body"}
            color={isOpened ? "paragraph-selected" : "paragraph"}
            sx={{
              ...(match
                ? {
                    whiteSpace: "pre-wrap"
                  }
                : {
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }),
              fontWeight: match ? "body" : "medium",
              display: "block",
              ".match": {
                bg: "accent-secondary",
                color: "accentForeground-secondary"
              }
            }}
          >
            {match
              ? match.map((match) => (
                  <>
                    <span>{match.prefix}</span>
                    <span className="match">{match.match}</span>
                    {match.suffix ? <span>{match.suffix}</span> : null}
                  </>
                ))
              : item.title.map((match) => (
                  <>
                    <span>{match.prefix}</span>
                    <span className="match">{match.match}</span>
                    {match.suffix ? <span>{match.suffix}</span> : null}
                  </>
                ))}
          </Text>
        </Flex>
      }
      footer={
        match ? undefined : (
          <Text variant="subBody">
            {item.content?.reduce((count, next) => next.length + count, 0) || 0}
          </Text>
        )
      }
      sx={{
        ...(match
          ? {
              px: 1,
              borderBottom: "1px solid var(--border)"
            }
          : {
              my: "small",
              borderRadius: "default"
            }),
        mx: 1
      }}
    />
  );
}

export default React.memo(SearchResult);

function findSelectedMatchIndex(item: HighlightedResult, matchIndex: number) {
  let activeIndex = 0;
  for (let i = 0; i <= matchIndex - 1; ++i) {
    activeIndex += item.content[i].length;
  }
  return activeIndex;
}
