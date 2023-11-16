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

import { Tags } from "@notesnook/core/dist/collections/tags";
import { Note, Tag, isGroupHeader } from "@notesnook/core/dist/types";
import { useThemeColors } from "@notesnook/theme";
import React, {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { TextInput, View } from "react-native";
import { ActionSheetRef, ScrollView } from "react-native-actions-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import { ToastManager, presentSheet } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useTagStore } from "../../../stores/use-tag-store";
import { SIZE } from "../../../utils/size";
import { IconButton } from "../../ui/icon-button";
import Input from "../../ui/input";
import { PressableButton } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { VirtualizedGrouping } from "@notesnook/core";

function tagHasSomeNotes(tagId: string, noteIds: string[]) {
  return db.relations.from({ type: "tag", id: tagId }, "note").has(...noteIds);
}

function tagHasAllNotes(tagId: string, noteIds: string[]) {
  return db.relations
    .from({ type: "tag", id: tagId }, "note")
    .hasAll(...noteIds);
}

const ManageTagsSheet = (props: {
  notes?: Note[];
  actionSheetRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const notes = useMemo(() => props.notes || [], [props.notes]);
  const tags = useTagStore((state) => state.tags);

  const [query, setQuery] = useState<string>();
  const inputRef = useRef<TextInput>(null);
  const [focus, setFocus] = useState(false);
  const [queryExists, setQueryExists] = useState(false);

  const checkQueryExists = (query: string) => {
    db.tags.all
      .find((v) => v.and([v(`title`, "==", query)]))
      .then((exists) => setQueryExists(!!exists));
  };

  const onSubmit = async () => {
    if (!query || query === "" || query.trimStart().length == 0) {
      ToastManager.show({
        heading: "Tag field is empty",
        type: "error",
        context: "local"
      });
      return;
    }

    const tag = query;
    setQuery(undefined);
    inputRef.current?.setNativeProps({
      text: ""
    });

    try {
      const exists = await db.tags.all.find((v) =>
        v.and([v(`title`, "==", tag)])
      );

      const id = exists
        ? exists?.id
        : await db.tags.add({
            title: tag
          });

      if (id) {
        for (const note of notes) {
          await db.relations.add(
            {
              id: id,
              type: "tag"
            },
            note
          );
        }
      }

      useRelationStore.getState().update();
      useTagStore.getState().setTags();
    } catch (e) {
      ToastManager.show({
        heading: "Cannot add tag",
        type: "error",
        message: (e as Error).message,
        context: "local"
      });
    }

    Navigation.queueRoutesForUpdate();
  };

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingHorizontal: 12,
        minHeight: focus ? "100%" : "60%"
      }}
    >
      <Input
        button={{
          icon: "magnify",
          color: colors.primary.accent,
          size: SIZE.lg,
          onPress: () => {}
        }}
        testID="tag-input"
        fwdRef={inputRef}
        autoCapitalize="none"
        onChangeText={(v) => {
          setQuery(Tags.sanitize(v));
          checkQueryExists(Tags.sanitize(v));
        }}
        onFocusInput={() => {
          setFocus(true);
        }}
        onBlurInput={() => {
          setFocus(false);
        }}
        onSubmit={() => {
          onSubmit();
        }}
        placeholder="Search or add a tag"
      />

      <ScrollView
        overScrollMode="never"
        scrollToOverflowEnabled={false}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
      >
        {query && !queryExists ? (
          <PressableButton
            key={"query_item"}
            customStyle={{
              flexDirection: "row",
              marginVertical: 5,
              justifyContent: "space-between",
              padding: 12
            }}
            onPress={onSubmit}
            type="selected"
          >
            <Heading size={SIZE.sm} color={colors.selected.heading}>
              Add {'"' + "#" + query + '"'}
            </Heading>
            <Icon name="plus" color={colors.selected.icon} size={SIZE.lg} />
          </PressableButton>
        ) : null}
        {!tags || tags.ids.length === 0 ? (
          <View
            style={{
              width: "100%",
              height: 200,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Heading size={50} color={colors.secondary.heading}>
              #
            </Heading>
            <Paragraph
              textBreakStrategy="balanced"
              color={colors.secondary.paragraph}
            >
              You do not have any tags.
            </Paragraph>
          </View>
        ) : null}

        {tags?.ids
          .filter((id) => !isGroupHeader(id))
          .map((item) => (
            <TagItem
              key={item as string}
              tags={tags}
              id={item as string}
              notes={notes}
            />
          ))}
      </ScrollView>
    </View>
  );
};

ManageTagsSheet.present = (notes?: Note[]) => {
  presentSheet({
    component: (ref) => {
      return <ManageTagsSheet actionSheetRef={ref} notes={notes} />;
    }
  });
};

export default ManageTagsSheet;

const TagItem = ({
  id,
  notes,
  tags
}: {
  id: string;
  notes: Note[];
  tags: VirtualizedGrouping<Tag>;
}) => {
  const { colors } = useThemeColors();
  const [tag, setTag] = useState<Tag>();
  const [selection, setSelection] = useState({
    all: false,
    some: false
  });
  const update = useRelationStore((state) => state.updater);

  const refresh = useCallback(() => {
    tags.item(id).then(async (tag) => {
      if (tag?.id) {
        setSelection({
          all: await tagHasAllNotes(
            tag.id,
            notes.map((note) => note.id)
          ),
          some: await tagHasSomeNotes(
            tag.id,
            notes.map((note) => note.id)
          )
        });
      }
      setTag(tag);
    });
  }, [id, tags, notes]);

  if (tag?.id !== id) {
    refresh();
  }

  useEffect(() => {
    if (tag?.id === id) {
      refresh();
    }
  }, [id, refresh, tag?.id, update]);

  const onPress = async () => {
    for (const note of notes) {
      try {
        if (!tag?.id) return;
        if (selection.all) {
          await db.relations.unlink(tag, note);
        } else {
          await db.relations.add(tag, note);
        }
      } catch (e) {
        console.error(e);
      }
    }
    useTagStore.getState().setTags();
    useRelationStore.getState().update();
    setTimeout(() => {
      Navigation.queueRoutesForUpdate();
    }, 1);
    refresh();
  };
  return (
    <PressableButton
      customStyle={{
        flexDirection: "row",
        marginVertical: 5,
        justifyContent: "flex-start",
        height: 40
      }}
      onPress={onPress}
      type="gray"
    >
      {!tag ? null : (
        <IconButton
          size={22}
          customStyle={{
            marginRight: 5,
            width: 23,
            height: 23
          }}
          onPress={onPress}
          color={
            selection.some || selection.all
              ? colors.selected.icon
              : colors.primary.icon
          }
          testID={
            selection.all
              ? "check-circle-outline"
              : selection.some
              ? "minus-circle-outline"
              : "checkbox-blank-circle-outline"
          }
          name={
            selection.all
              ? "check-circle-outline"
              : selection.some
              ? "minus-circle-outline"
              : "checkbox-blank-circle-outline"
          }
        />
      )}
      {tag ? (
        <Paragraph size={SIZE.sm}>{"#" + tag?.title}</Paragraph>
      ) : (
        <View
          style={{
            width: 200,
            height: 30,
            backgroundColor: colors.secondary.background,
            borderRadius: 5
          }}
        />
      )}
    </PressableButton>
  );
};
