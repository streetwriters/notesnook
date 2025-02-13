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
  ContentBlock,
  Note,
  VirtualizedGrouping,
  createInternalLink
} from "@notesnook/core";
import type { LinkAttributes } from "@notesnook/editor";
import { NativeEvents } from "@notesnook/editor-mobile/src/utils/native-events";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { FlatList } from "react-native-actions-sheet";
import { db } from "../../../common/database";
import { useDBItem } from "../../../hooks/use-db-item";
import { editorController } from "../../../screens/editor/tiptap/utils";
import { presentSheet } from "../../../services/event-manager";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size";
import { Button } from "../../ui/button";
import Input from "../../ui/input";
import { Pressable } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";

const ListNoteItem = ({
  id,
  items,
  onSelectNote
}: {
  id: any;
  items: VirtualizedGrouping<Note> | undefined;
  onSelectNote: any;
}) => {
  const [item] = useDBItem(id, "note", items);
  return (
    <Pressable
      onPress={() => {
        if (!item) return;
        onSelectNote(item as Note);
      }}
      type={"transparent"}
      style={{
        paddingVertical: 12,
        flexDirection: "row",
        width: "100%",
        justifyContent: "flex-start",
        height: 50
      }}
    >
      <View
        style={{
          flexShrink: 1
        }}
      >
        <Paragraph numberOfLines={1}>{item?.title}</Paragraph>
      </View>
    </Pressable>
  );
};

const ListBlockItem = ({
  item,
  onSelectBlock
}: {
  item: ContentBlock;
  onSelectBlock: any;
}) => {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={() => {
        onSelectBlock(item);
      }}
      type={"transparent"}
      style={{
        flexDirection: "row",
        width: "100%",
        justifyContent: "flex-start",
        minHeight: 45
      }}
    >
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          columnGap: 10,
          alignItems: "flex-start",
          borderBottomWidth: 1,
          borderBottomColor: colors.primary.border,
          paddingVertical: 5,
          justifyContent: "space-between"
        }}
      >
        <Paragraph
          style={{
            flexShrink: 1
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
            height: 25,
            minWidth: 25,
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

export default function LinkNote(props: {
  attributes: LinkAttributes;
  resolverId: string;
  onLinkCreated: () => void;
  close?: (ctx?: string) => void;
}) {
  const { colors } = useThemeColors();
  const query = useRef<string>();
  const [notes, setNotes] = useState<VirtualizedGrouping<Note>>();
  const nodesRef = useRef<ContentBlock[]>([]);
  const [nodes, setNodes] = useState<ContentBlock[]>([]);

  const inputRef = useRef<TextInput>();

  const [selectedNote, setSelectedNote] = useState<Note>();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();

  useEffect(() => {
    db.notes.all.sorted(db.settings.getGroupOptions("notes")).then((notes) => {
      setNotes(notes);
    });
  }, []);

  const onChange = async (value: string) => {
    query.current = value;
    if (!selectedNote) {
      const notes = await db.lookup.notes(value).sorted();
      setNotes(notes);
    } else {
      if (value.startsWith("#")) {
        const headingNodes = nodesRef.current.filter((n) =>
          n.type.match(/(h1|h2|h3|h4|h5|h6)/g)
        );
        setNodes(
          headingNodes.filter((n) => n.content.includes(value.slice(1)))
        );
      } else {
        setNodes(nodesRef.current.filter((n) => n.content.includes(value)));
      }
    }
  };

  const onCreateLink = (blockId?: string) => {
    if (!selectedNote) return;
    const link = createInternalLink(
      "note",
      selectedNote.id,
      blockId
        ? {
            blockId: blockId
          }
        : undefined
    );
    editorController.current?.postMessage(NativeEvents.resolve, {
      data: {
        href: link,
        title: selectedNote.title
      },
      resolverId: props.resolverId
    });
  };

  const onSelectNote = async (note: Note) => {
    setSelectedNote(note);
    inputRef.current?.clear();
    setTimeout(async () => {
      nodesRef.current = await db.notes.contentBlocks(note.id);
      setNodes(nodesRef.current);
    });
    // Fetch and set note's nodes.
  };

  const onSelectBlock = (block: ContentBlock) => {
    onCreateLink(block.id);
    props.onLinkCreated();
    props.close?.();
  };

  return (
    <View
      style={{
        paddingHorizontal: 12,
        minHeight: "100%",
        maxHeight: "100%"
      }}
    >
      <View
        style={{
          flexDirection: "column",
          width: "100%",
          alignItems: "flex-start",
          gap: 10
        }}
      >
        <Input
          placeholder={
            selectedNote
              ? strings.searchSectionToLinkPlaceholder()
              : strings.searchNoteToLinkPlaceholder()
          }
          containerStyle={{
            width: "100%"
          }}
          marginBottom={0}
          onChangeText={(value) => {
            onChange(value);
          }}
        />

        {selectedNote ? (
          <View
            style={{
              gap: 10
            }}
          >
            <Paragraph color={colors.secondary.paragraph} size={AppFontSize.xs}>
              {strings.linkNoteSelectedNote()}
            </Paragraph>
            <Pressable
              onPress={() => {
                setSelectedNote(undefined);
                setSelectedNodeId(undefined);
                setNodes([]);
              }}
              style={{
                flexDirection: "row",
                width: "100%",
                justifyContent: "flex-start",
                height: 45,
                borderWidth: 1,
                borderColor: colors.primary.accent,
                paddingHorizontal: 12
              }}
              type="secondaryAccented"
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%"
                }}
              >
                <Paragraph numberOfLines={1}>{selectedNote?.title}</Paragraph>

                <Paragraph
                  color={colors.secondary.paragraph}
                  size={AppFontSize.xs}
                >
                  {strings.tapToDeselect()}
                </Paragraph>
              </View>
            </Pressable>

            {nodes?.length > 0 ? (
              <Paragraph
                style={{
                  marginBottom: 12
                }}
                color={colors.secondary.paragraph}
                size={AppFontSize.xs}
              >
                {strings.linkNoteToSection()}
              </Paragraph>
            ) : null}
          </View>
        ) : null}
      </View>

      {selectedNote ? (
        <FlatList
          renderItem={({ item, index }) => (
            <ListBlockItem item={item} onSelectBlock={onSelectBlock} />
          )}
          style={{
            marginTop: 10
          }}
          keyboardShouldPersistTaps="handled"
          windowSize={3}
          keyExtractor={(item) => item.id}
          data={nodes}
        />
      ) : (
        <FlatList
          renderItem={({ item, index }: any) => (
            <ListNoteItem
              id={index}
              items={notes}
              onSelectNote={onSelectNote}
            />
          )}
          keyboardShouldPersistTaps="handled"
          style={{
            marginTop: 10
          }}
          windowSize={3}
          data={notes?.placeholders}
        />
      )}

      {selectedNote ? (
        <Button
          style={{
            marginTop: 10
          }}
          title={strings.createLink()}
          type="accent"
          width="100%"
          onPress={() => {
            onCreateLink();
            props.onLinkCreated();
            props.close?.();
          }}
        />
      ) : null}
    </View>
  );
}

LinkNote.present = (attributes: LinkAttributes, resolverId: string) => {
  let didCreateLink = false;
  presentSheet({
    component: (ref, close) => (
      <LinkNote
        attributes={attributes}
        resolverId={resolverId}
        onLinkCreated={() => {
          didCreateLink = true;
        }}
        close={close}
      />
    ),
    onClose: () => {
      if (!didCreateLink) {
        editorController?.current.commands.dismissCreateInternalLinkRequest(
          resolverId
        );
      }
    }
  });
};
