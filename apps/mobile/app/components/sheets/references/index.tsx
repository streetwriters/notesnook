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
import {
  InternalLink,
  TextSlice,
  VirtualizedGrouping,
  createInternalLink,
  highlightInternalLinks
} from "@notesnook/core";
import { ContentBlock, ItemReference, Note } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import create from "zustand";
import { db } from "../../../common/database";
import { useDBItem, useNoteLocked } from "../../../hooks/use-db-item";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import { useRelationStore } from "../../../stores/use-relation-store";
import { eOnLoadNote } from "../../../utils/events";
import { fluidTabsRef } from "../../../utils/global-refs";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size";
import SheetProvider from "../../sheet-provider";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { Pressable } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";

export const useExpandedStore = create<{
  expanded: {
    [id: string]: boolean;
  };
  setExpanded: (id: string) => void;
}>((set, get) => ({
  expanded: {},
  setExpanded(id: string) {
    set({
      expanded: {
        ...get().expanded,
        [id]: !get().expanded[id]
      }
    });
  }
}));

const ListBlockItem = ({
  item,
  onSelectBlock
}: {
  item: ContentBlock;
  onSelectBlock: () => void;
}) => {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={() => {
        onSelectBlock();
      }}
      type={"transparent"}
      style={{
        flexDirection: "row",
        width: "100%",
        paddingLeft: 35,
        justifyContent: "flex-start",
        minHeight: 45,
        paddingHorizontal: 12
      }}
    >
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          columnGap: 10,
          justifyContent: "space-between"
        }}
      >
        <Paragraph
          style={{
            flexShrink: 1,
            marginTop: 2
          }}
        >
          {item?.content.length > 200
            ? item?.content.slice(0, 200) + "..."
            : !item.content || item.content.trim() === ""
            ? strings.linkNoteEmptyBlock()
            : item.content}
        </Paragraph>

        <View
          style={{
            borderRadius: defaultBorderRadius,
            backgroundColor: colors.secondary.background,
            width: 25,
            height: 25,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Paragraph color={colors.secondary.paragraph} size={AppFontSize.xs}>
            {item.type.toUpperCase()}
          </Paragraph>
        </View>
      </View>
    </Pressable>
  );
};

const ListNoteInternalLink = ({
  link,
  onSelect
}: {
  link: {
    blockId: string;
    highlightedText: [TextSlice, TextSlice, TextSlice][];
  };
  onSelect: () => void;
}) => {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={() => {
        onSelect();
      }}
      type={"transparent"}
      style={{
        flexDirection: "row",
        width: "100%",
        paddingLeft: 35,
        justifyContent: "flex-start",
        minHeight: 45
      }}
    >
      <View
        style={{
          width: "100%",
          rowGap: 10
        }}
      >
        {link.highlightedText.map((text) => (
          <Paragraph
            key={`root_${text[0].text}`}
            style={{
              flexShrink: 1,
              marginTop: 2,
              flexWrap: "wrap"
            }}
          >
            {text.map((slice) =>
              !slice.highlighted ? (
                slice.text
              ) : (
                <Paragraph
                  key={slice.text}
                  color={colors.selected.accent}
                  style={{
                    textDecorationLine: "underline",
                    textDecorationColor: colors.selected.accent
                  }}
                >
                  {slice.text}
                </Paragraph>
              )
            )}
          </Paragraph>
        ))}
      </View>
    </Pressable>
  );
};

const ListNoteItem = ({
  id,
  items,
  onSelect,
  reference,
  internalLinks,
  listType
}: {
  id: number;
  items: VirtualizedGrouping<Note> | undefined;
  onSelect: (item: Note, blockId?: string) => void;
  reference: Note;
  internalLinks: MutableRefObject<InternalLink<"note">[] | undefined>;
  listType: "linkedNotes" | "referencedIn";
}) => {
  const { colors } = useThemeColors();
  const [item] = useDBItem(id, "note", items);
  const expanded = useExpandedStore((state) =>
    !item ? false : state.expanded[item.id]
  );
  const locked = useNoteLocked(item?.id);
  const [linkedBlocks, setLinkedBlocks] = useState<ContentBlock[]>([]);
  const [noteInternalLinks, setNoteInternalLinks] = useState<
    {
      blockId: string;
      highlightedText: [TextSlice, TextSlice, TextSlice][];
    }[]
  >([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item?.id && expanded) {
      (async () => {
        if (listType === "linkedNotes") {
          if (linkedBlocks.length) return;
          setLoading(true);
          if (!internalLinks.current) {
            internalLinks.current = await db.notes.internalLinks(reference.id);
          }
          const noteLinks = internalLinks.current.filter(
            (link) => link.id === item.id && link.params?.blockId
          );

          if (noteLinks.length) {
            const blocks = await db.notes.contentBlocks(item.id);

            setLinkedBlocks(
              blocks.filter((block) =>
                noteLinks.find((link) => block.id === link.params?.blockId)
              )
            );
          }
        } else {
          if (noteInternalLinks.length) return;
          setLoading(true);

          const blocks = await db.notes.contentBlocksWithLinks(item.id);
          setNoteInternalLinks(
            blocks
              .filter((block) =>
                block.content.includes(createInternalLink("note", reference.id))
              )
              .map((block) => {
                return {
                  blockId: block?.id as string,
                  highlightedText: highlightInternalLinks(
                    block as ContentBlock,
                    reference.id
                  )
                };
              })
          );
        }

        setLoading(false);
      })();
    }
  }, [
    item?.id,
    expanded,
    linkedBlocks.length,
    internalLinks,
    reference.id,
    listType,
    noteInternalLinks.length
  ]);

  const renderBlock = React.useCallback(
    (block: ContentBlock) => (
      <ListBlockItem
        item={block}
        onSelectBlock={() => {
          if (!item) return;
          onSelect(item, block.id);
        }}
      />
    ),
    [item, onSelect]
  );

  const renderInternalLink = React.useCallback(
    (link: {
      blockId: string;
      highlightedText: [TextSlice, TextSlice, TextSlice][];
    }) => (
      <ListNoteInternalLink
        link={link}
        onSelect={() => {
          if (!item) return;
          onSelect(item, link.blockId);
        }}
      />
    ),
    [item, onSelect]
  );

  return (
    <View
      style={{
        flexDirection: "column",
        width: "100%",
        justifyContent: "flex-start",
        alignItems: "center"
      }}
    >
      <Pressable
        type={"plain"}
        onPress={() => {
          if (!item) return;
          onSelect(item as Note);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "100%",
          height: 45
        }}
      >
        <IconButton
          size={AppFontSize.xl}
          onPress={() => {
            if (!item?.id) return;
            useExpandedStore.getState().setExpanded(item?.id);
          }}
          top={0}
          left={0}
          bottom={0}
          right={0}
          style={{
            width: 35,
            height: 35
          }}
          name={expanded ? "chevron-down" : "chevron-right"}
        />
        <Paragraph numberOfLines={1}>{item?.title}</Paragraph>
      </Pressable>

      {expanded && !locked ? (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            width: "100%"
          }}
        >
          {loading ? (
            <ActivityIndicator
              color={colors.primary.accent}
              size={AppFontSize.lg}
            />
          ) : (
            <>
              {listType === "linkedNotes" ? (
                <>
                  {linkedBlocks.length === 0 ? (
                    <Paragraph color={colors.secondary.paragraph}>
                      {strings.noBlocksLinked()}
                    </Paragraph>
                  ) : (
                    linkedBlocks.map(renderBlock)
                  )}
                </>
              ) : (
                <>
                  {noteInternalLinks.length === 0 ? (
                    <Paragraph color={colors.secondary.paragraph}>
                      {strings.noReferencesFound()}
                    </Paragraph>
                  ) : (
                    noteInternalLinks.map(renderInternalLink)
                  )}
                </>
              )}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
};

type ReferencesListProps = {
  item: { id: string; type: string };
  close?: (ctx?: any) => void;
};

export const ReferencesList = ({ item, close }: ReferencesListProps) => {
  const [tab, setTab] = useState(0);
  const updater = useRelationStore((state) => state.updater);
  const { colors } = useThemeColors();
  const [items, setItems] = useState<VirtualizedGrouping<Note>>();
  const hasNoRelations = !items || items?.placeholders?.length === 0;
  const internalLinks = useRef<InternalLink<"note">[]>();

  useEffect(() => {
    db.relations?.[tab === 0 ? "from" : "to"]?.(
      { id: item?.id, type: item?.type } as ItemReference,
      "note"
    )
      .selector.sorted({
        sortBy: "dateEdited",
        sortDirection: "desc"
      })
      .then((items) => {
        setItems(items);
      });
  }, [item?.id, item?.type, tab]);

  const renderNote = React.useCallback(
    ({ index }: any) => (
      <ListNoteItem
        id={index}
        items={items}
        onSelect={(note, blockId) => {
          eSendEvent(eOnLoadNote, {
            item: note,
            blockId: blockId
          });
          fluidTabsRef.current?.goToPage("editor");
          close?.();
        }}
        reference={item as Note}
        internalLinks={internalLinks}
        listType={tab === 0 ? "linkedNotes" : "referencedIn"}
      />
    ),
    [items, item, tab, close]
  );

  return (
    <View style={{ height: "100%" }}>
      <SheetProvider context="local" />

      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: colors.primary.border
        }}
      >
        <Button
          type={"plain"}
          title={strings.linkedNotes()}
          style={{
            borderRadius: 0,
            borderWidth: 0,
            borderBottomWidth: 3,
            borderColor: tab === 0 ? colors.primary.accent : "transparent",
            height: 40,
            width: "50%"
          }}
          onPress={() => {
            setTab(0);
          }}
        />
        <Button
          type={"plain"}
          title={strings.referencedIn()}
          style={{
            width: "50%",
            borderWidth: 0,
            borderRadius: 0,
            borderBottomWidth: 3,
            borderColor: tab === 1 ? colors.primary.accent : "transparent",
            height: 40
          }}
          onPress={() => {
            setTab(1);
          }}
        />
      </View>

      {hasNoRelations ? (
        <View
          style={{
            height: "85%",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Paragraph color={colors.secondary.paragraph}>
            {tab === 1 ? strings.notReferenced() : strings.notLinked()}
          </Paragraph>
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: 12,
            flex: 1,
            marginTop: 10
          }}
        >
          <FlashList
            bounces={false}
            data={items.placeholders}
            renderItem={renderNote}
          />
        </View>
      )}
    </View>
  );
};

ReferencesList.present = ({
  reference
}: {
  reference: { id: string; type: string };
}) => {
  presentSheet({
    component: (ref, close, update) => (
      <ReferencesList item={reference} close={close} />
    ),
    onClose: () => {
      useExpandedStore.setState({
        expanded: {}
      });
    }
  });
};
