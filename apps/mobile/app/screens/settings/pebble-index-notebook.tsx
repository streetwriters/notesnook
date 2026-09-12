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
import { Notebook } from "@notesnook/core";
import { useNavigation } from "@react-navigation/native";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { db } from "../../common/database";
import Input from "../../components/ui/input";
import { Pressable } from "../../components/ui/pressable";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import SettingsService from "../../services/settings";
import { Settings, useSettingStore } from "../../stores/use-setting-store";
import { NotesnookModule } from "../../utils/notesnook-module";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";

async function loadAllNotebooks(): Promise<Notebook[]> {
  const seen = new Map<string, Notebook>();

  const add = (notebook?: Notebook | null) => {
    if (notebook?.id && notebook.type !== "trash") {
      seen.set(notebook.id, notebook);
    }
  };

  try {
    const ids =
      typeof db.notebooks.all.ids === "function"
        ? await db.notebooks.all.ids()
        : [];
    if (ids?.length) {
      const items = await db.notebooks.all.items(ids);
      for (const notebook of items || []) add(notebook);
    }
  } catch (e) {
    console.warn("PEBBLE INDEX notebooks ids() failed", e);
  }

  if (seen.size === 0) {
    try {
      const grouped = await db.notebooks.all.sorted(
        db.settings.getGroupOptions("notebooks")
      );
      const total = grouped?.placeholders?.length ?? 0;
      for (let i = 0; i < total; i++) {
        const row = await grouped.item(i);
        add((row as { item?: Notebook })?.item);
      }
    } catch (e) {
      console.warn("PEBBLE INDEX notebooks sorted() failed", e);
    }
  }

  if (seen.size === 0) {
    try {
      const roots = await db.notebooks.roots.sorted(
        db.settings.getGroupOptions("notebooks")
      );
      const total = roots?.placeholders?.length ?? 0;
      for (let i = 0; i < total; i++) {
        const row = await roots.item(i);
        add((row as { item?: Notebook })?.item);
      }
    } catch (e) {
      console.warn("PEBBLE INDEX notebooks roots failed", e);
    }
  }

  return Array.from(seen.values()).sort((a, b) =>
    (a.title || "").localeCompare(b.title || "", undefined, {
      sensitivity: "base"
    })
  );
}

type RowItem = {
  id: string;
  title: string;
  subtitle?: string;
};

type NotebookKeys = {
  idKey: keyof Settings;
  titleKey: keyof Settings;
  description: string;
  noneSubtitle: string;
};

function PebbleNotebookPicker({
  idKey,
  titleKey,
  description,
  noneSubtitle
}: NotebookKeys) {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const selected = (useSettingStore((state) => state.settings[idKey]) as string) || "";
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await loadAllNotebooks();
        if (!cancelled) setNotebooks(all);
      } catch {
        if (!cancelled) setNotebooks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<RowItem[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? notebooks.filter((notebook) =>
          (notebook.title || "").toLowerCase().includes(q)
        )
      : notebooks;
    return [
      {
        id: "",
        title: "None",
        subtitle: noneSubtitle
      },
      ...matches.map((notebook) => ({
        id: notebook.id,
        title: notebook.title || "Untitled"
      }))
    ];
  }, [notebooks, query, noneSubtitle]);

  const pick = (id: string, title: string) => {
    SettingsService.set({
      [idKey]: id,
      [titleKey]: title
    });
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1 }}>
      <Paragraph
        size={AppFontSize.xs}
        color={colors.secondary.paragraph}
        style={{
          paddingHorizontal: DefaultAppStyles.GAP,
          marginBottom: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        {description}
      </Paragraph>
      <View style={{ paddingHorizontal: DefaultAppStyles.GAP }}>
        <Input
          testID="pebble-index-notebook-search"
          placeholder="Search notebooks"
          onChangeText={(text) => setQuery(text)}
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id || "none"}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: DefaultAppStyles.GAP,
          paddingBottom: DefaultAppStyles.GAP
        }}
        renderItem={({ item }) => {
          const isSelected = selected === item.id;
          return (
            <Pressable
              onPress={() => pick(item.id, item.id ? item.title : "")}
              type={isSelected ? "selected" : "transparent"}
              style={{
                paddingVertical: DefaultAppStyles.GAP_VERTICAL,
                paddingHorizontal: DefaultAppStyles.GAP,
                borderRadius: 10,
                marginBottom: DefaultAppStyles.GAP_VERTICAL_SMALL
              }}
            >
              <Heading size={AppFontSize.md}>{item.title}</Heading>
              {!!item.subtitle && (
                <Paragraph
                  size={AppFontSize.xs}
                  color={colors.secondary.paragraph}
                >
                  {item.subtitle}
                </Paragraph>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Paragraph
            size={AppFontSize.xs}
            color={colors.secondary.paragraph}
            style={{ padding: DefaultAppStyles.GAP }}
          >
            {loading
              ? "Loading notebooks…"
              : query
                ? "No notebooks match that search."
                : "No notebooks yet. Create one first, then pick it here."}
          </Paragraph>
        }
      />
    </View>
  );
}

export function PebbleIndexNotebookPicker() {
  return (
    <PebbleNotebookPicker
      idKey="pebbleIndexNotebookId"
      titleKey="pebbleIndexNotebookTitle"
      description="New Index 01 notes go here. Choose none to keep the current behavior."
      noneSubtitle="Notes list only (or your default notebook)"
    />
  );
}

export function PebbleIndexReminderNotebookPicker() {
  return (
    <PebbleNotebookPicker
      idKey="pebbleIndexReminderNotebookId"
      titleKey="pebbleIndexReminderNotebookTitle"
      description="Index reminders become notes in this notebook, with an alarm on the note."
      noneSubtitle="Notes list only (or your default notebook)"
    />
  );
}

const ALERT_MODES: {
  id: "silent" | "vibrate" | "urgent";
  title: string;
  subtitle: string;
}[] = [
  { id: "silent", title: "Silent", subtitle: "No sound or vibration" },
  { id: "vibrate", title: "Vibrate", subtitle: "Vibrate only" },
  { id: "urgent", title: "Urgent", subtitle: "Sound and vibration" }
];

export function PebbleIndexReminderAlertPicker() {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const selected =
    useSettingStore((state) => state.settings.pebbleIndexReminderPriority) ||
    "urgent";

  return (
    <View style={{ flex: 1, paddingHorizontal: DefaultAppStyles.GAP }}>
      <Paragraph
        size={AppFontSize.xs}
        color={colors.secondary.paragraph}
        style={{ marginBottom: DefaultAppStyles.GAP_VERTICAL }}
      >
        Alert style for Index reminder notes.
      </Paragraph>
      {ALERT_MODES.map((mode) => {
        const isSelected = selected === mode.id;
        return (
          <Pressable
            key={mode.id}
            onPress={() => {
              SettingsService.set({ pebbleIndexReminderPriority: mode.id });
              NotesnookModule.setPebbleIndexReminderPriority?.(mode.id);
              navigation.goBack();
            }}
            type={isSelected ? "selected" : "transparent"}
            style={{
              paddingVertical: DefaultAppStyles.GAP_VERTICAL,
              paddingHorizontal: DefaultAppStyles.GAP,
              borderRadius: 10,
              marginBottom: DefaultAppStyles.GAP_VERTICAL_SMALL
            }}
          >
            <Heading size={AppFontSize.md}>{mode.title}</Heading>
            <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
              {mode.subtitle}
            </Paragraph>
          </Pressable>
        );
      })}
    </View>
  );
}
