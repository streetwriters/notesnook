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
import ListContainer from "../components/list-container";
import { useStore as useNbStore } from "../stores/notebook-store";
import { useStore as useAppStore } from "../stores/app-store";
import { hashNavigate } from "../navigation";
import TopicsPlaceholder from "../components/placeholders/topics-placeholder";
import { Button, Flex, Text } from "@theme-ui/components";
import { Edit, RemoveShortcutLink, ShortcutLink } from "../components/icons";
import { getTotalNotes } from "../common";
import { formatDate } from "@notesnook/core/utils/date";
import { db } from "../common/db";
import { pluralize } from "../utils/string";

function Topics() {
  const selectedNotebookTopics = useNbStore(
    (store) => store.selectedNotebookTopics
  );
  const selectedNotebookId = useNbStore((store) => store.selectedNotebookId);
  const refresh = useNbStore((store) => store.setSelectedNotebook);

  return (
    <>
      <ListContainer
        type="topics"
        groupType="topics"
        refresh={() => refresh(selectedNotebookId)}
        items={selectedNotebookTopics}
        context={{ notebookId: selectedNotebookId }}
        placeholder={TopicsPlaceholder}
        header={
          <NotebookHeader
            notebook={db.notebooks.notebook(selectedNotebookId).data}
          />
        }
        button={{
          content: "Add a new topic",
          onClick: () => hashNavigate(`/topics/create`)
        }}
      />
    </>
  );
}
export default Topics;

function NotebookHeader({ notebook }) {
  const { title, description, topics, dateEdited } = notebook;
  const [isShortcut, setIsShortcut] = useState(false);
  const shortcuts = useAppStore((store) => store.shortcuts);
  const addToShortcuts = useAppStore((store) => store.addToShortcuts);
  const totalNotes = getTotalNotes(notebook);

  useEffect(() => {
    setIsShortcut(shortcuts.findIndex((p) => p.id === notebook.id) > -1);
  }, [shortcuts, notebook]);

  return (
    <Flex mx={2} my={2} sx={{ flexDirection: "column" }}>
      <Text variant="subBody">{formatDate(dateEdited)}</Text>
      <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="heading">{title}</Text>
        <Flex>
          <Button
            variant="tool"
            sx={{ borderRadius: 100, width: 30, height: 30 }}
            mr={1}
            p={0}
            title={isShortcut ? "Remove shortcut" : "Create shortcut"}
            onClick={() => addToShortcuts(notebook)}
          >
            {isShortcut ? (
              <RemoveShortcutLink size={16} />
            ) : (
              <ShortcutLink size={16} />
            )}
          </Button>
          <Button
            variant="tool"
            sx={{ borderRadius: 100, width: 30, height: 30 }}
            p={0}
            title="Edit notebook"
            onClick={() => hashNavigate(`/notebooks/${notebook.id}/edit`)}
          >
            <Edit size={16} />
          </Button>
        </Flex>
      </Flex>

      {description && (
        <Text variant="body" sx={{ fontSize: "subtitle" }}>
          {description}
        </Text>
      )}
      <Text as="em" variant="subBody" mt={2}>
        {pluralize(topics.length, "topic", "topics")},{" "}
        {pluralize(totalNotes, "note", "notes")}
      </Text>
    </Flex>
  );
}
