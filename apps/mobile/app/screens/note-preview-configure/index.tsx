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
import { Note, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { db } from "../../common/database";
import { Header } from "../../components/header";
import Input from "../../components/ui/input";
import Paragraph from "../../components/ui/typography/paragraph";
import { useDBItem } from "../../hooks/use-db-item";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { useSettingStore } from "../../stores/use-setting-store";
import { NotesnookModule } from "../../utils/notesnook-module";

const NoteItem = (props: {
  id: string | number;
  items?: VirtualizedGrouping<Note>;
}) => {
  const { colors } = useThemeColors();
  const [item] = useDBItem(props.id, "note", props.items);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        const widgetId = NotesnookModule.getWidgetId();
        NotesnookModule.setString(
          "appPreview",
          String(widgetId),
          JSON.stringify(item)
        );
        setTimeout(() => {
          NotesnookModule.saveAndFinish();
        });
      }}
      style={{
        flexDirection: "column",
        borderBottomWidth: 1,
        borderBottomColor: colors.primary.border,
        justifyContent: "center",
        paddingVertical: 12,
        minHeight: 45
      }}
    >
      {!item ? null : (
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 12
          }}
        >
          <View
            style={{
              flexDirection: "column"
            }}
          >
            <Paragraph
              numberOfLines={1}
              style={{
                color: colors.primary.paragraph,
                fontSize: 15
              }}
            >
              {item.title}
            </Paragraph>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const NotePreviewConfigure = () => {
  const [items, setItems] = useState<VirtualizedGrouping<Note>>();
  const loading = useSettingStore((state) => state.isAppLoading);
  const bounceRef = React.useRef<NodeJS.Timeout>();
  const { colors } = useThemeColors();
  const insets = useGlobalSafeAreaInsets();

  useEffect(() => {
    useSettingStore.getState().setDeviceMode("mobile");
    if (loading) return;
    db.notes.all.sorted(db.settings.getGroupOptions("notes")).then((notes) => {
      setItems(notes);
    });
  }, [loading]);

  const renderItem = React.useCallback(
    ({ index }: { item: boolean; index: number }) => {
      return <NoteItem id={index} items={items} />;
    },
    [items]
  );

  return (
    <View
      style={{
        backgroundColor: colors.primary.background,
        flex: 1
      }}
    >
      <Header
        canGoBack
        title="Select a note"
        onLeftMenuButtonPress={() => {
          NotesnookModule.cancelAndFinish();
        }}
      />

      <View
        style={{
          paddingHorizontal: 12,
          paddingTop: 6
        }}
      >
        <Input
          placeholder="Search for notes"
          containerStyle={{
            height: 50
          }}
          onChangeText={(value) => {
            bounceRef.current = setTimeout(() => {
              if (!value) {
                db.notes.all
                  .sorted(db.settings.getGroupOptions("notes"))
                  .then((notes) => {
                    setItems(notes);
                  });
                return;
              }
              db.lookup
                .notes(value)
                .sorted()
                .then((notes) => {
                  setItems(notes);
                });
            }, 500);
          }}
        />

        <FlatList
          data={items?.placeholders}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          renderItem={renderItem}
          windowSize={1}
          ListFooterComponent={<View style={{ height: 200 }} />}
        />
      </View>
    </View>
  );
};
