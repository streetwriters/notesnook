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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../common/database";
import { Header } from "../../components/header";
import Input from "../../components/ui/input";
import Paragraph from "../../components/ui/typography/paragraph";
import {
  createNotesWidgetSource,
  getBuiltinNotesWidgetSources,
  NotesWidget,
  NotesWidgetSource
} from "../../services/widgets/notes-widget";
import { useSettingStore } from "../../stores/use-setting-store";
import { NotesnookModule } from "../../utils/notesnook-module";
import { DefaultAppStyles } from "../../utils/styles";

type Row = { source: NotesWidgetSource; group: string };

async function loadRows(includeBuiltins: boolean): Promise<Row[]> {
  const [notebooks, tags, colors] = await Promise.all([
    db.notebooks.all.items(),
    db.tags.all.items(),
    db.colors.all.items()
  ]);
  const general = strings.dataTypesPluralCamelCase.note();
  return [
    ...(includeBuiltins
      ? getBuiltinNotesWidgetSources().map((source) => ({
          source,
          group: general
        }))
      : []),
    ...notebooks.map((item) => ({
      source: createNotesWidgetSource("notebook", item.title, item.id),
      group: strings.dataTypesPluralCamelCase.notebook()
    })),
    ...tags.map((item) => ({
      source: createNotesWidgetSource("tag", item.title, item.id),
      group: strings.dataTypesPluralCamelCase.tag()
    })),
    ...colors.map((item) => ({
      source: createNotesWidgetSource("color", item.title, item.id),
      group: strings.colors()
    }))
  ];
}

export const NotesSourcePicker = (props: {
  onSelect: (source: NotesWidgetSource) => void;
  onCancel: () => void;
  includeBuiltins?: boolean;
  description?: string;
}) => {
  const { colors } = useThemeColors();
  const loading = useSettingStore((state) => state.isAppLoading);
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (loading) return;
    loadRows(props.includeBuiltins !== false).then(setRows);
  }, [loading, props.includeBuiltins]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text
      ? rows.filter((row) => row.source.title.toLowerCase().includes(text))
      : rows;
  }, [rows, query]);

  return (
    <SafeAreaView
      style={{ backgroundColor: colors.primary.background, flex: 1 }}
    >
      <Header
        canGoBack
        title={strings.dataTypesPluralCamelCase.note()}
        onLeftMenuButtonPress={props.onCancel}
      />
      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP,
          paddingTop: 6,
          flex: 1
        }}
      >
        {props.description ? (
          <Paragraph
            size={13}
            color={colors.secondary.paragraph}
            style={{ paddingVertical: DefaultAppStyles.GAP_VERTICAL }}
          >
            {props.description}
          </Paragraph>
        ) : null}
        <Input
          placeholder={strings.search()}
          containerStyle={{ height: 50 }}
          onChangeText={setQuery}
        />
        <FlatList
          data={filtered}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(row) => row.source.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => props.onSelect(item.source)}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: colors.primary.border,
                paddingVertical: DefaultAppStyles.GAP_VERTICAL,
                minHeight: 45,
                justifyContent: "center"
              }}
            >
              <Paragraph
                numberOfLines={1}
                style={{ color: colors.primary.paragraph, fontSize: 15 }}
              >
                {item.source.title}
              </Paragraph>
              <Paragraph size={12} color={colors.secondary.paragraph}>
                {item.group}
              </Paragraph>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Paragraph
              color={colors.secondary.paragraph}
              style={{ textAlign: "center", marginTop: 40 }}
            >
              {query ? strings.noResultsFound() : strings.noSourcesYet()}
            </Paragraph>
          }
          ListFooterComponent={<View style={{ height: 200 }} />}
        />
      </View>
    </SafeAreaView>
  );
};

export const NotesWidgetConfigure = () => {
  useEffect(() => {
    useSettingStore.getState().setDeviceMode("mobile");
  }, []);

  return (
    <NotesSourcePicker
      onSelect={(source) => {
        NotesWidget.configure(NotesnookModule.getWidgetId(), source);
        setTimeout(() => NotesnookModule.saveAndFinish());
      }}
      onCancel={() => NotesnookModule.cancelAndFinish()}
    />
  );
};
