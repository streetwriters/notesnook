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
import { GroupedItems, Note, Tag } from "@notesnook/core/dist/types";
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

function ungroup(items: GroupedItems<Tag>) {
  return items.filter((item) => item.type !== "header") as Tag[];
}

const ManageTagsSheet = (props: {
  notes?: Note[];
  actionSheetRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const notes = useMemo(() => props.notes || [], [props.notes]);
  const allTags = useTagStore((state) => ungroup(state.tags));
  const [tags, setTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState<string>();
  const inputRef = useRef<TextInput>(null);
  const [focus, setFocus] = useState(false);

  const sortTags = useCallback(() => {
    let _tags = db.tags.all;

    _tags = _tags.sort((a, b) => a.title.localeCompare(b.title));
    if (query) {
      _tags = db.lookup.tags(_tags, query) as Tag[];
    }
    let tagsMerged = notes
      .map((note) => db.relations.to(note, "tag").resolved())
      .flat();
    // Get unique tags and remove duplicates
    tagsMerged = [
      ...new Map(tagsMerged.map((item) => [item.id, item])).values()
    ];

    if (!tagsMerged || !tagsMerged.length) {
      setTags(_tags);
      return;
    }

    let noteTags = [];
    for (const tag of tagsMerged) {
      const index = _tags.findIndex((t) => t.id === tag.id);
      if (index !== -1) {
        noteTags.push(_tags[index]);
        _tags.splice(index, 1);
      }
    }
    noteTags = noteTags.sort((a, b) => a.title.localeCompare(b.title));
    const combinedTags = [...noteTags, ..._tags];

    setTags(combinedTags);
  }, [notes, query]);

  // useEffect(() => {
  //   sortTags();
  // }, [allTags.length]);

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
      const exists = db.tags.all.filter((t: Tag) => t.title === tag);
      const id = exists.length
        ? exists[0]?.id
        : await db.tags.add({
            title: tag
          });

      const createdTag = db.tags.tag(id);
      if (createdTag) {
        for (const note of notes) {
          await db.relations.add(createdTag, note);
        }
      }
      useRelationStore.getState().update();
      useTagStore.getState().setTags();
      setTimeout(() => {
        sortTags();
      });
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
          setTimeout(() => {
            sortTags();
          });
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
        {query && query !== tags[0]?.title ? (
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
        {!allTags || allTags.length === 0 ? (
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

        {tags.map((item) => (
          <TagItem key={item.id} tag={item} notes={notes} />
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

const TagItem = ({ tag, notes }: { tag: Tag; notes: Note[] }) => {
  const { colors } = useThemeColors();
  const update = useRelationStore((state) => state.updater);

  const someNotesTagged = notes.some((note) => {
    const relations = db.relations.from(tag, "note");
    return relations.findIndex((relation) => relation.to.id === note.id) > -1;
  });

  const allNotesTagged = notes.every((note) => {
    const relations = db.relations.from(tag, "note");
    return relations.findIndex((relation) => relation.to.id === note.id) > -1;
  });

  const onPress = async () => {
    for (const note of notes) {
      try {
        if (someNotesTagged) {
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
      <IconButton
        size={22}
        customStyle={{
          marginRight: 5,
          width: 23,
          height: 23
        }}
        color={
          someNotesTagged || allNotesTagged
            ? colors.selected.icon
            : colors.primary.icon
        }
        testID={
          allNotesTagged
            ? "check-circle-outline"
            : someNotesTagged
            ? "minus-circle-outline"
            : "checkbox-blank-circle-outline"
        }
        name={
          allNotesTagged
            ? "check-circle-outline"
            : someNotesTagged
            ? "minus-circle-outline"
            : "checkbox-blank-circle-outline"
        }
      />
      <Paragraph size={SIZE.sm}>{"#" + tag.title}</Paragraph>
    </PressableButton>
  );
};
