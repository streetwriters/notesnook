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
import { Note, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../common/database";
import { Radius, Spacing } from "../../common/design/spacing";
import { Header } from "../../components/header";
import LinkNote from "../../components/sheets/link-note";
import Input from "../../components/ui/input";
import { Pressable } from "../../components/ui/pressable";
import LineSeparator from "../../components/ui/seperator/line-separator";
import { TimeSince } from "../../components/ui/time-since";
import Heading from "../../components/ui/typography/heading";
import { useDBItem } from "../../hooks/use-db-item";
import Navigation, { NavigationProps } from "../../services/navigation";
import { AppFontSize } from "../../utils/size";
import { editorController } from "../editor/tiptap/utils";

const NoteReferenceItem = ({
  id,
  items,
  onSelectNote
}: {
  id: number;
  items?: VirtualizedGrouping<Note>;
  onSelectNote: (note: Note) => void;
}) => {
  const { colors } = useThemeColors();
  const [item] = useDBItem(id, "note", items);

  if (!item) {
    return <View style={{ height: 72, marginBottom: Spacing.LEVEL_2 }} />;
  }

  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.LEVEL_2,
        borderWidth: 1,
        borderColor: colors.secondary.border,
        borderRadius: Radius.S,
        paddingHorizontal: Spacing.LEVEL_3,
        paddingVertical: Spacing.LEVEL_3,
        marginBottom: Spacing.LEVEL_2
      }}
      onPress={() => {
        onSelectNote(item);
      }}
      type="plain"
      customSelectedColor={colors.primary.shade}
    >
      <View style={{ flex: 1, gap: Spacing.LEVEL_0 }}>
        <Heading fontSize="MD" color={colors.primary.heading}>
          {item.title}
        </Heading>
        <TimeSince
          time={item.dateEdited}
          updateFrequency={60000}
          style={{
            fontSize: AppFontSize.xs,
            color: colors.secondary.paragraph
          }}
        />
      </View>
    </Pressable>
  );
};

const AddReference = (props: NavigationProps<"AddReference">) => {
  const { resolverId } = props.route.params;
  const { colors } = useThemeColors();
  const [notes, setNotes] = useState<VirtualizedGrouping<Note>>();
  const didCreateLink = useRef(false);

  useEffect(() => {
    db.notes.all.sorted(db.settings.getGroupOptions("notes")).then((notes) => {
      setNotes(notes);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (!didCreateLink.current) {
        editorController.current?.commands.dismissCreateInternalLinkRequest(
          resolverId
        );
      }
    };
  }, [resolverId]);

  const onSearch = async (value: string) => {
    if (!value) {
      setNotes(await db.notes.all.sorted(db.settings.getGroupOptions("notes")));
      return;
    }
    setNotes(await db.lookup.notes(value).sorted());
  };

  const onSelectNote = (note: Note) => {
    LinkNote.present(note, resolverId, () => {
      didCreateLink.current = true;
      Navigation.goBack();
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.primary.background }}
    >
      <Header
        renderedInRoute="AddReference"
        id="AddReference"
        title={strings.linkNote()}
        style={{ backgroundColor: colors.primary.background }}
        canGoBack
      />

      <View
        style={{
          flex: 1,
          paddingHorizontal: Spacing.LEVEL_3,
          paddingTop: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_3
        }}
      >
        <Input
          placeholder={strings.searchNoteToLinkPlaceholder()}
          containerStyle={{ width: "100%" }}
          marginBottom={0}
          onChangeText={onSearch}
          button={{
            icon: "search",
            iconFamily: "notesnook",
            color: colors.secondary.icon,
            onPress: () => {}
          }}
        />

        <LineSeparator />

        <LegendList
          data={notes?.placeholders || []}
          extraData={notes}
          estimatedItemSize={72}
          keyboardShouldPersistTaps="handled"
          renderItem={({ index }) => (
            <NoteReferenceItem
              id={index}
              items={notes}
              onSelectNote={onSelectNote}
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default AddReference;
