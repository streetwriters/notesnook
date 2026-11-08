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

import { useEffect, useState } from "react";
import type { Notebook } from "@notesnook/core";
import { formatDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text } from "@ui";
import { useStore as useAppStore } from "../stores/app-store";
import { useStore as useSettingStore } from "../stores/setting-store";
import {
  LinkBreak,
  LinkSimple,
  NoteCalendar,
  Notebook as NotebookIcon,
  PencilSimple
} from "./icons";

export function NotebookHeader(props: {
  notebook: Notebook;
  totalNotes: number;
}) {
  const { notebook, totalNotes } = props;
  const shortcuts = useAppStore((store) => store.shortcuts);
  const addToShortcuts = useAppStore((store) => store.addToShortcuts);
  const dateFormat = useSettingStore((store) => store.dateFormat);
  const [isShortcut, setIsShortcut] = useState(false);

  useEffect(() => {
    setIsShortcut(shortcuts.findIndex((p) => p.id === notebook.id) > -1);
  }, [shortcuts, notebook.id]);

  return (
    <Flex
      testID="notebook-header"
      sx={{
        flexDirection: "column",
        mt: "spacing6",
        gap: "spacing7",
        px: "spacing6",
        py: "spacing4",
        bg: "background-selected"
      }}
    >
      <Flex sx={{ flexDirection: "column", gap: "spacing6" }}>
        <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
          <Flex
            sx={{ flexDirection: "row", alignItems: "center", gap: "spacing3" }}
          >
            <NotebookIcon size={17} color="icon" />
            <Text
              testID="notebook-title"
              sx={{ fontSize: "md", fontWeight: 500, color: "heading" }}
            >
              {notebook.title}
            </Text>
          </Flex>
          {notebook.description ? (
            <Text sx={{ fontSize: "3xs", fontWeight: 400, color: "paragraph" }}>
              {notebook.description}
            </Text>
          ) : null}
        </Flex>
      </Flex>
      <Flex
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Flex
          sx={{ flexDirection: "row", alignItems: "center", gap: "spacing2" }}
        >
          <NoteCalendar size={13} color="icon-secondary" />
          <Text
            sx={{ fontSize: "3xs", color: "paragraph", lineHeight: "125%" }}
          >
            {formatDate(notebook.dateEdited, { type: "date", dateFormat })}
          </Text>
          <Text sx={{ fontSize: "3xs", color: "icon-disabled" }}>•</Text>
          <Text sx={{ fontSize: "3xs", color: "paragraph" }}>
            {strings.notes(totalNotes || 0)}
          </Text>
        </Flex>
        <Flex
          sx={{ flexDirection: "row", alignItems: "center", gap: "spacing4" }}
        >
          <Button
            variant="icon"
            sx={{ p: 0 }}
            onPress={() => addToShortcuts(notebook)}
          >
            {isShortcut ? <LinkBreak size={15} /> : <LinkSimple size={15} />}
          </Button>
          <Button variant="icon" sx={{ p: 0 }}>
            <PencilSimple size={15} />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
