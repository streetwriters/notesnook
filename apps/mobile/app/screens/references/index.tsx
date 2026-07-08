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
import { LegendList } from "@legendapp/list";
import {
  ItemReference,
  Note,
  TextSlice,
  createInternalLink,
  highlightInternalLinks
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { Radius, Spacing } from "../../common/design/spacing";
import { db } from "../../common/database";
import { Header } from "../../components/header";
import AppIcon from "../../components/ui/AppIcon";
import { Pressable } from "../../components/ui/pressable";
import { TimeSince } from "../../components/ui/time-since";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { eSendEvent } from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import { useRelationStore } from "../../stores/use-relation-store";
import { getElevationStyle } from "../../utils/elevation";
import { eOnLoadNote } from "../../utils/events";
import { fluidTabsRef } from "../../utils/global-refs";
import { AppFontSize } from "../../utils/size";
import { SafeAreaView } from "react-native-safe-area-context";
import CirclesBackground from "../../components/ui/circles-background";
import LineSeparator from "../../components/ui/seperator/line-separator";
import Input from "../../components/ui/input";

type ListType = "linkedNotes" | "referencedIn";
type ReferenceItem = {
  note: Note;
  blockId?: string;
  highlightedText?: [TextSlice, TextSlice, TextSlice][];
  searchText: string;
};

const ReferenceNoteCard = ({
  item: { note, blockId, highlightedText },
  listType,
  onSelect
}: {
  item: ReferenceItem;
  listType: ListType;
  onSelect: (item: Note, blockId?: string) => void;
}) => {
  const { colors } = useThemeColors();

  return (
    <Pressable
      type="transparent"
      onPress={() =>
        onSelect(note, listType === "referencedIn" ? blockId : undefined)
      }
      style={{
        alignItems: "flex-start",
        borderWidth: 1,
        borderColor: colors.primary.border,
        borderRadius: Radius.S,
        padding: Spacing.LEVEL_3,
        gap: Spacing.LEVEL_2,
        marginBottom: Spacing.LEVEL_2
      }}
    >
      {listType === "linkedNotes" ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_0
          }}
        >
          <AppIcon
            name="check-circle"
            iconFamily="notesnook"
            size={12}
            color={colors.primary.accent}
          />
          <Paragraph
            fontFamily="SEMI_BOLD"
            fontSize="XS"
            color={colors.primary.accent}
          >
            {strings.linked()}
          </Paragraph>
        </View>
      ) : null}

      <Heading fontSize="MD" color={colors.primary.heading}>
        {note.title}
      </Heading>

      {listType === "referencedIn" && highlightedText ? (
        <Paragraph
          fontSize="SM"
          numberOfLines={2}
          color={colors.secondary.paragraph}
        >
          {highlightedText[0]?.map((slice, index) =>
            slice.highlighted ? (
              <Paragraph
                key={`${slice.text}_${index}`}
                fontFamily="SEMI_BOLD"
                fontSize="SM"
                color={colors.primary.accent}
                style={{ textDecorationLine: "underline" }}
              >
                {slice.text}
              </Paragraph>
            ) : (
              slice.text
            )
          )}
        </Paragraph>
      ) : null}

      <TimeSince
        time={note.dateEdited}
        updateFrequency={60000}
        style={{ fontSize: AppFontSize.xs, color: colors.secondary.paragraph }}
      />

      {listType === "referencedIn" ? (
        <Pressable
          type="transparent"
          onPress={() => onSelect(note, blockId)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: Spacing.LEVEL_1,
            borderWidth: 1,
            borderColor: colors.primary.border,
            borderRadius: Radius.S,
            paddingHorizontal: Spacing.LEVEL_2,
            paddingVertical: Spacing.LEVEL_1,
            flexShrink: 1,
            width: "auto"
          }}
        >
          <Heading fontSize="SM" fontFamily="SEMI_BOLD">
            {strings.jumpToReference()}
          </Heading>
          <AppIcon
            name="arrow-square-out"
            iconFamily="notesnook"
            size={16}
            color={colors.primary.icon}
          />
        </Pressable>
      ) : null}
    </Pressable>
  );
};

const References = (props: NavigationProps<"References">) => {
  const reference = props.route.params.reference;
  const [tab, setTab] = useState(0);
  const updater = useRelationStore((state) => state.updater);
  const { colors } = useThemeColors();
  const [items, setItems] = useState<ReferenceItem[]>();
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const isSearching = searchQuery.length > 0;
  const hasNoRelations = !items || items.length === 0;
  const cache = useRef<Record<number, ReferenceItem[]>>({});

  useEffect(() => {
    cache.current = {};
  }, [reference.id, reference.type, updater]);

  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const listType: ListType = tab === 0 ? "linkedNotes" : "referencedIn";

    const build = async (): Promise<ReferenceItem[]> => {
      const notes = await db.relations[tab === 0 ? "from" : "to"](
        { id: reference.id, type: reference.type } as ItemReference,
        "note"
      ).selector.items(undefined, {
        sortBy: "dateEdited",
        sortDirection: "desc"
      });

      if (listType === "linkedNotes") {
        return notes.map((note) => ({
          note,
          searchText: note.title.toLowerCase()
        }));
      }

      const link = createInternalLink("note", reference.id);
      return Promise.all(
        notes.map(async (note) => {
          const blocks = await db.notes.contentBlocksWithLinks(note.id);
          const linkedBlocks = blocks.filter((block) =>
            block.content.includes(link)
          );
          const excerpt = linkedBlocks[0];
          return {
            note,
            blockId: excerpt?.id,
            highlightedText: excerpt
              ? highlightInternalLinks(excerpt, reference.id)
              : undefined,
            searchText: `${note.title} ${linkedBlocks
              .map((block) => block.content)
              .join(" ")}`.toLowerCase()
          };
        })
      );
    };

    (async () => {
      const resolved = cache.current[tab] || (await build());
      cache.current[tab] = resolved;
      if (cancelled) return;

      const q = searchQuery.toLowerCase();
      setItems(
        q ? resolved.filter((item) => item.searchText.includes(q)) : resolved
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [reference.id, reference.type, tab, updater, searchQuery]);

  const onSelect = useCallback((note: Note, blockId?: string) => {
    eSendEvent(eOnLoadNote, {
      item: note,
      blockId: blockId
    });
    fluidTabsRef.current?.goToPage("editor");
    Navigation.goBack();
  }, []);

  const renderNote = useCallback(
    ({ item }: { item: ReferenceItem }) => (
      <ReferenceNoteCard
        item={item}
        listType={tab === 0 ? "linkedNotes" : "referencedIn"}
        onSelect={onSelect}
      />
    ),
    [tab, onSelect]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.primary.background }}
    >
      <Header
        renderedInRoute="References"
        id="References"
        title={strings.references()}
        style={{
          backgroundColor: colors.primary.background
        }}
        canGoBack
      />

      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        <Input
          placeholder={strings.searchANote()}
          onChangeText={setQuery}
          returnKeyType="search"
          containerStyle={{
            borderWidth: 0,
            backgroundColor: colors.secondary.background
          }}
          button={{
            icon: "search",
            iconFamily: "notesnook",
            color: colors.primary.icon,
            size: 16,
            onPress: () => {}
          }}
        />

        <LineSeparator paddingVertical={Spacing.LEVEL_3} />
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_3
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: Spacing.LEVEL_2,
            backgroundColor: colors.secondary.background,
            padding: Spacing.LEVEL_1,
            borderRadius: Radius.S
          }}
        >
          {[strings.linkedNotes(), strings.usedIn()].map((label, index) => {
            const active = tab === index;
            return (
              <Pressable
                key={label}
                type="transparent"
                onPress={() => setTab(index)}
                style={{
                  flex: 1,
                  paddingVertical: Spacing.LEVEL_3,
                  paddingHorizontal: Spacing.LEVEL_1,
                  borderRadius: Radius.XS,
                  backgroundColor: active
                    ? colors.primary.background
                    : "transparent",
                  ...(active ? getElevationStyle(2) : {})
                }}
              >
                <Heading
                  fontSize="MD"
                  style={{ textAlign: "center" }}
                  color={
                    active ? colors.primary.accent : colors.secondary.paragraph
                  }
                >
                  {label}
                </Heading>
              </Pressable>
            );
          })}
        </View>

        {!hasNoRelations ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              gap: Spacing.LEVEL_2
            }}
          >
            <CirclesBackground>
              <AppIcon
                name={isSearching ? "search" : "link-simple"}
                iconFamily="notesnook"
                size={18}
                color={colors.primary.accentForeground}
              />
            </CirclesBackground>

            <View
              style={{
                gap: Spacing.LEVEL_1,
                alignItems: "center"
              }}
            >
              <Heading
                style={{
                  textAlign: "center"
                }}
                fontSize="XL"
              >
                {isSearching
                  ? strings.noResultsFound(searchQuery)
                  : tab === 1
                    ? strings.notReferenced()
                    : strings.notLinked()}
              </Heading>
              {isSearching ? null : (
                <Paragraph
                  style={{
                    textAlign: "center",
                    maxWidth: 270
                  }}
                  fontSize="SM"
                >
                  {tab === 1
                    ? strings.emptyReferences()
                    : strings.linkedNotes()}
                </Paragraph>
              )}
            </View>
          </View>
        ) : (
          <LegendList
            bounces={false}
            data={items || []}
            keyExtractor={(item) => item.note.id}
            renderItem={renderNote}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default References;
