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

import { HighlightedResult, Match as TMatch } from "@notesnook/core";
import { Button, Flex, Text } from "@theme-ui/components";
import React, { Fragment, useState } from "react";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import ListItem from "../list-item";
import { CaretDownSvgIcon } from "../icons";
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

  const showMatches = isExpanded && !isCompact;
  const matchCount =
    item.content?.reduce((count, next) => next.length + count, 0) || 0;
  const titleHasMatch = item.title.some((match) => !!match.match);

  return (
    <Flex
      sx={{
        flexDirection: "column",
        px: "spacing6",
        "[data-item-index='0'] > &": { pt: "spacing4" },
        "[data-item-index]:last-child > &": {
          ".search-result-content": { borderBottom: "none" }
        }
      }}
    >
      <Flex
        className="search-result-content"
        sx={{
          flexDirection: "column",
          gap: "spacing3",
          py: "spacing2",
          borderBottom: "1px solid",
          borderBottomColor: "separator"
        }}
      >
        <ListItem
          isFocused={isOpened}
          item={item}
          menuItems={menuItems}
          colors={{
            heading: "heading",
            accent: "accent",
            background: showMatches ? "hover" : "transparent",
            backgroundSelected: "background-selected"
          }}
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
            <Flex
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                gap: "spacing3",
                minWidth: 0
              }}
            >
              <Flex
                sx={{
                  alignItems: "center",
                  gap: "spacing3",
                  minWidth: 0
                }}
              >
                {isExpandable && !isCompact ? (
                  <Button
                    variant="secondary"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bg: "transparent",
                      p: 0,
                      flexShrink: 0,
                      ":hover:not(:disabled)": { bg: "transparent" },
                      ":active:not(:disabled)": { bg: "transparent" }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded((s) => !s);
                    }}
                  >
                    <CaretDownSvgIcon
                      size={11}
                      color={isOpened ? "icon-selected" : "icon-secondary"}
                      sx={{
                        transform: isExpanded ? undefined : "rotate(-90deg)"
                      }}
                    />
                  </Button>
                ) : null}
                <Text
                  data-test-id={`title`}
                  sx={{
                    ...textStyle,
                    color: isOpened
                      ? "paragraph-selected"
                      : titleHasMatch
                      ? "paragraph-secondary"
                      : "paragraph",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "block",
                    minWidth: 0
                  }}
                >
                  {item.title.map((match) => (
                    <Match key={match.id} match={match} />
                  ))}
                </Text>
              </Flex>

              {matchCount > 0 ? (
                <Text
                  sx={{
                    ...textStyle,
                    color: "paragraph",
                    flexShrink: 0
                  }}
                >
                  {matchCount}
                </Text>
              ) : null}
            </Flex>
          }
          sx={{
            p: "spacing2",
            borderRadius: "radius1"
          }}
        />
        {showMatches
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
                    activeSearchResultId: match[0].id
                  });
                }}
                onMiddleClick={() => {
                  useEditorStore.getState().openSession(item.id, {
                    openInNewTab: true,
                    rawContent: item.rawContent,
                    activeSearchResultId: match[0].id
                  });
                }}
                title={
                  <Text
                    data-test-id={`title`}
                    sx={{
                      ...textStyle,
                      color: "paragraph-secondary",
                      whiteSpace: "pre-wrap",
                      display: "block"
                    }}
                  >
                    {match.map((match) => (
                      <Match key={match.id} match={match} />
                    ))}
                  </Text>
                }
                sx={{
                  p: "spacing2",
                  borderRadius: "radius1",
                  backgroundColor: "transparent",
                  ":focus": { backgroundColor: "hover" },
                  ":focus-visible": { backgroundColor: "hover" },
                  ":hover": { backgroundColor: "hover" }
                }}
              />
            ))
          : null}
      </Flex>
    </Flex>
  );
}

const textStyle = {
  fontFamily: "body",
  fontSize: "xs",
  fontWeight: 400,
  ".match": {
    bg: "accent",
    color: "accentForeground",
    py: "spacing1"
  }
} as const;

export default React.memo(SearchResult);

function Match({ match }: { match: TMatch }) {
  return (
    <Fragment key={match.id}>
      <span>{match.prefix}</span>
      <span className="match">{match.match}</span>
      {match.suffix ? <span>{match.suffix}</span> : null}
    </Fragment>
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
