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
import { useIsFeatureAvailable } from "@notesnook/common";
import { ContentBlock, Note, createInternalLink } from "@notesnook/core";
import { NativeEvents } from "@notesnook/editor-mobile/src/utils/native-events";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { Radius, Spacing } from "../../../common/design/spacing";
import { db } from "../../../common/database";
import { editorController } from "../../../screens/editor/tiptap/utils";
import { presentSheet, ToastManager } from "../../../services/event-manager";
import { getElevationStyle } from "../../../utils/elevation";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

type LinkMode = "note" | "paragraphs";

const ParagraphItem = ({
  block,
  selected,
  onSelect
}: {
  block: ContentBlock;
  selected: boolean;
  onSelect: (block: ContentBlock) => void;
}) => {
  const { colors } = useThemeColors();
  const content =
    !block.content || block.content.trim() === ""
      ? strings.linkNoteEmptyBlock()
      : block.content.length > 200
        ? block.content.slice(0, 200) + "..."
        : block.content;

  return (
    <Pressable
      type={selected ? "selected" : "transparent"}
      onPress={() => onSelect(block)}
      style={{
        width: "100%",
        padding: Spacing.LEVEL_2,
        borderRadius: Radius.S,
        borderWidth: selected ? 0 : 1,
        borderColor: colors.secondary.border,
        alignItems: "flex-start"
      }}
    >
      <Paragraph
        fontSize="SM"
        numberOfLines={2}
        color={selected ? colors.primary.heading : colors.primary.paragraph}
      >
        {content}
      </Paragraph>
    </Pressable>
  );
};

export default function LinkNote(props: {
  note: Note;
  resolverId: string;
  onLinkCreated: () => void;
  close?: (ctx?: string) => void;
}) {
  const { note, resolverId } = props;
  const { colors } = useThemeColors();
  const { height } = useWindowDimensions();
  const blockLinking = useIsFeatureAvailable("blockLinking");
  const [mode, setMode] = useState<LinkMode>("note");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>();

  useEffect(() => {
    db.notes.contentBlocks(note.id).then((result) => setBlocks(result));
  }, [note.id]);

  const onAddLink = () => {
    const blockId = mode === "paragraphs" ? selectedBlockId : undefined;
    const link = createInternalLink(
      "note",
      note.id,
      blockId ? { blockId } : undefined
    );
    editorController.current?.postMessage(NativeEvents.resolve, {
      data: {
        href: link,
        title: note.title
      },
      resolverId
    });
    props.close?.();
    props.onLinkCreated();
    ToastManager.show({
      message: strings.linkAdded(),
      type: "success",
      context: "global"
    });
  };

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_2,
        paddingBottom: Spacing.LEVEL_2,
        gap: Spacing.LEVEL_4
      }}
    >
      <View style={{ gap: Spacing.LEVEL_1 }}>
        <Heading fontSize="XL" lineHeight="100%">
          {strings.linkOptions()}
        </Heading>
        <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
          {strings.linkOptionsDesc()}
        </Paragraph>
      </View>

      <View style={{ gap: Spacing.LEVEL_2 }}>
        <Heading fontSize="LG" lineHeight="100%">
          {strings.selectedNoteLabel()}
        </Heading>
        <View
          style={{
            backgroundColor: colors.secondary.background,
            borderRadius: Radius.XS,
            paddingHorizontal: Spacing.LEVEL_2,
            paddingVertical: Spacing.LEVEL_3
          }}
        >
          <Paragraph
            color={colors.primary.heading}
            fontFamily="MEDIUM"
            fontSize="SM"
          >
            {note.title}
          </Paragraph>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: Spacing.LEVEL_2,
          backgroundColor: colors.secondary.background,
          padding: Spacing.LEVEL_1,
          borderRadius: Radius.S
        }}
      >
        {(
          [
            { key: "note", label: strings.linkEntireNote() },
            { key: "paragraphs", label: strings.specifyParagraphs() }
          ] as { key: LinkMode; label: string }[]
        ).map(({ key, label }) => {
          const active = mode === key;
          return (
            <Pressable
              key={key}
              type="transparent"
              onPress={() => setMode(key)}
              style={{
                flex: 1,
                paddingVertical: Spacing.LEVEL_2,
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

      {mode === "note" ? (
        <View style={{ gap: Spacing.LEVEL_1 }}>
          <Paragraph fontFamily="MEDIUM" fontSize="SM">
            {strings.linkedReferences()}
          </Paragraph>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.LEVEL_1,
              padding: Spacing.LEVEL_2,
              borderRadius: Radius.S,
              borderWidth: 1,
              borderColor: colors.secondary.border
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: Radius.XS,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.secondary.background
              }}
            >
              <AppIcon
                name="file-text"
                iconFamily="notesnook"
                size={20}
                color={colors.primary.icon}
              />
            </View>
            <Heading fontSize="SM" style={{ flexShrink: 1 }}>
              {strings.entireNote()}
            </Heading>
          </View>
        </View>
      ) : (
        <View style={{ gap: Spacing.LEVEL_3 }}>
          <Heading fontSize="LG" lineHeight="100%">
            {strings.selectParagraphs()}
          </Heading>
          {blockLinking?.isAllowed ? (
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: height * 0.4 }}
              contentContainerStyle={{ gap: Spacing.LEVEL_2 }}
            >
              {blocks.map((block) => (
                <ParagraphItem
                  key={block.id}
                  block={block}
                  selected={selectedBlockId === block.id}
                  onSelect={(b) => setSelectedBlockId(b.id)}
                />
              ))}
            </ScrollView>
          ) : (
            <View
              style={{
                gap: Spacing.LEVEL_2,
                backgroundColor: colors.secondary.background,
                padding: Spacing.LEVEL_3,
                borderRadius: Radius.S,
                borderWidth: 0.5,
                borderColor: colors.secondary.border,
                alignItems: "center"
              }}
            >
              <Paragraph color={colors.secondary.paragraph}>
                {blockLinking?.error}
              </Paragraph>
              <Button
                title={strings.upgradePlan()}
                style={{ width: "100%" }}
                type="accent"
              />
            </View>
          )}
        </View>
      )}

      <Button
        title={strings.addLink()}
        type="accent"
        disabled={
          mode === "paragraphs" &&
          selectedBlockId === undefined &&
          blocks.length !== 0
        }
        width="100%"
        onPress={onAddLink}
      />
    </View>
  );
}

LinkNote.present = (
  note: Note,
  resolverId: string,
  onLinkCreated: () => void
) => {
  presentSheet({
    component: (ref, close) => (
      <LinkNote
        note={note}
        resolverId={resolverId}
        onLinkCreated={onLinkCreated}
        close={close}
      />
    )
  });
};
