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

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import { ToastEvent, presentSheet } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useTagStore } from "../../../stores/use-tag-store";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../../utils/size";
import Input from "../../ui/input";
import { PressableButton } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { IconButton } from "../../ui/icon-button";
const ManageTagsSheet = (props) => {
  const { colors } = useThemeColors();
  const [notes, setNotes] = useState(props.notes || []);
  const allTags = useTagStore((state) => state.tags);
  const [tags, setTags] = useState([]);
  const [query, setQuery] = useState(null);
  const inputRef = useRef();
  const [focus, setFocus] = useState(false);

  useEffect(() => {
    sortTags();
  }, [allTags, notes, query, sortTags]);

  const sortTags = useCallback(() => {
    let _tags = [...allTags];
    _tags = _tags.filter((t) => t.type === "tag");
    _tags = _tags.sort((a, b) => a.title.localeCompare(b.title));
    if (query) {
      _tags = _tags.filter((t) => t.title.startsWith(query));
    }
    const tagsMerged = [...notes.map((note) => note.tags || []).flat()];

    if (!tagsMerged || !tagsMerged.length) {
      setTags(_tags);
      return;
    }
    let noteTags = [];
    for (let tag of tagsMerged) {
      let index = _tags.findIndex((t) => t.title === tag);
      if (index !== -1) {
        noteTags.push(_tags[index]);
        _tags.splice(index, 1);
      }
    }
    noteTags = noteTags.sort((a, b) => a.title.localeCompare(b.title));
    let combinedTags = [...noteTags, ..._tags];
    setTags(combinedTags);
  }, [allTags, notes, query]);

  useEffect(() => {
    useTagStore.getState().setTags();
  }, []);

  const onSubmit = async () => {
    let _query = query;
    if (!_query || _query === "" || _query.trimStart().length == 0) {
      ToastEvent.show({
        heading: "Tag field is empty",
        type: "error",
        context: "local"
      });
      return;
    }

    let tag = _query;
    setNotes(
      notes.map((note) => ({
        ...note,
        tags: note.tags ? [...note.tags, tag] : [tag]
      }))
    );

    setQuery(null);
    inputRef.current?.setNativeProps({
      text: ""
    });
    try {
      for (let note of notes) {
        await db.notes.note(note.id).tag(tag);
      }
      useTagStore.getState().setTags();
      setNotes(notes.map((note) => db.notes.note(note.id).data));
    } catch (e) {
      ToastEvent.show({
        heading: "Cannot add tag",
        type: "error",
        message: e.message,
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
          size: SIZE.lg
        }}
        testID="tag-input"
        fwdRef={inputRef}
        autoCapitalize="none"
        onChangeText={(v) => {
          setQuery(db.tags.sanitize(v));
        }}
        onFocusInput={() => {
          setFocus(true);
        }}
        onBlurInput={() => {
          setFocus(false);
        }}
        onSubmit={onSubmit}
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
            type="accent"
          >
            <Heading size={SIZE.sm} color={colors.static.white}>
              Add {'"' + "#" + query + '"'}
            </Heading>
            <Icon name="plus" color={colors.static.white} size={SIZE.lg} />
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
          <TagItem
            key={item.title}
            tag={item}
            notes={notes}
            setNotes={setNotes}
          />
        ))}
      </ScrollView>
    </View>
  );
};

ManageTagsSheet.present = (notes) => {
  presentSheet({
    component: (ref) => {
      return <ManageTagsSheet actionSheetRef={ref} notes={notes} />;
    }
  });
};

export default ManageTagsSheet;

const TagItem = ({ tag, notes, setNotes }) => {
  const { colors } = useThemeColors();
  const someNotesTagged = notes.some(
    (note) => note.tags?.indexOf(tag.title) !== -1
  );
  const allNotesTagged = notes.every(
    (note) => note.tags?.indexOf(tag.title) !== -1
  );
  const onPress = async () => {
    for (let note of notes) {
      try {
        if (someNotesTagged) {
          await db.notes
            .note(note.id)
            .untag(note.tags[note.tags.indexOf(tag.title)]);
        } else {
          await db.notes.note(note.id).tag(tag.title);
        }
      } catch (e) {
        console.error(e);
      }
    }
    useTagStore.getState().setTags();
    setNotes(notes.map((note) => db.notes.note(note.id).data));
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
            ? colors.primary.accent
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
      <Paragraph size={SIZE.sm}>{"#" + tag.alias}</Paragraph>
    </PressableButton>
  );
};
