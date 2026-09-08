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

import React, { useEffect } from "react";
import { Flex, Text } from "@notesnook/ui";
import { useStore } from "../stores/note-store";
import ListContainer from "../components/list-container";
import useNavigate from "../hooks/use-navigate";
import Placeholder from "../components/placeholders";
import { useSearch } from "../hooks/use-search";
import { db } from "../common/db";
import { useEditorStore } from "../stores/editor-store";
import { ListLoader } from "../components/loaders/list-loader";
import notesEmptyView from "../assets/notes-empty-view.svg";

function Home() {
  const notes = useStore((store) => store.notes);
  const isCompact = useStore((store) => store.viewMode === "compact");
  const refresh = useStore((store) => store.refresh);
  const setContext = useStore((store) => store.setContext);
  const filteredItems = useSearch(
    "notes",
    async (query, sortOptions) => {
      if (useStore.getState().context) return;
      return await db.lookup.notesWithHighlighting(
        query,
        db.notes.all,
        sortOptions
      );
    },
    [notes]
  );

  useNavigate("home", setContext);

  useEffect(() => {
    useStore.getState().refresh();
  }, []);

  if (!notes) return <ListLoader />;
  return (
    <ListContainer
      type="home"
      group="home"
      compact={isCompact}
      refresh={refresh}
      items={filteredItems || notes}
      isSearching={!!filteredItems}
      placeholder={
        filteredItems ? <Placeholder context="search" /> : <NotesPlaceholder />
      }
      button={{
        onClick: () => useEditorStore.getState().newSession()
      }}
    />
  );
}
export default React.memo(Home, () => true);

function NotesPlaceholder() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "center",
        gap: "spacing7",
        width: "100%"
      }}
    >
      <img src={notesEmptyView} alt="" width={230} height={230} />
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          gap: "spacing3",
          textAlign: "center"
        }}
      >
        <Text
          variant="body"
          sx={{
            fontSize: "md",
            fontWeight: 600,
            color: "heading",
            lineHeight: 1
          }}
        >
          Create your first note.
        </Text>
        <Text
          sx={{
            fontSize: "sm",
            color: "paragraph",
            lineHeight: 1.2
          }}
        >
          Click the{" "}
          <Text as="span" sx={{ color: "accent" }}>
            New Note
          </Text>{" "}
          button in the sidebar to get started.
        </Text>
      </Flex>
    </Flex>
  );
}
