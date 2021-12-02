import React, { useEffect, useState } from "react";
import ListContainer from "../components/list-container";
import { useStore as useNbStore } from "../stores/notebook-store";
import { useStore as useAppStore } from "../stores/app-store";
import { hashNavigate } from "../navigation";
import TopicsPlaceholder from "../components/placeholders/topics-placeholder";
import { Button, Flex, Text } from "rebass";
import { Edit, RemoveShortcutLink, ShortcutLink } from "../components/icons";
import { getTotalNotes } from "../common";
import { formatDate } from "notes-core/utils/date";
import { db } from "../common/db";

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
          onClick: () => hashNavigate(`/topics/create`),
        }}
      />
    </>
  );
}
export default Topics;

function NotebookHeader({ notebook }) {
  const { title, description, topics, dateEdited } = notebook;
  const [isShortcut, setIsShortcut] = useState(false);
  const menuPins = useAppStore((store) => store.menuPins);
  const pinItemToMenu = useAppStore((store) => store.pinItemToMenu);
  useEffect(() => {
    setIsShortcut(menuPins.findIndex((p) => p.id === notebook.id) > -1);
  }, [menuPins, notebook]);

  return (
    <Flex flexDirection="column" mx={2} my={2}>
      <Text variant="subBody">{formatDate(dateEdited)}</Text>
      <Flex justifyContent="space-between" alignItems="center">
        <Text variant="heading">{title}</Text>
        <Flex>
          <Button
            variant="tool"
            sx={{ borderRadius: 100 }}
            mr={1}
            p={0}
            width={30}
            height={30}
            title={isShortcut ? "Remove shortcut" : "Create shortcut"}
            onClick={() => pinItemToMenu(notebook)}
          >
            {isShortcut ? (
              <RemoveShortcutLink size={16} />
            ) : (
              <ShortcutLink size={16} />
            )}
          </Button>
          <Button
            variant="tool"
            sx={{ borderRadius: 100 }}
            p={0}
            width={30}
            height={30}
            title="Edit notebook"
            onClick={() => hashNavigate(`/notebooks/${notebook.id}/edit`)}
          >
            <Edit size={16} />
          </Button>
        </Flex>
      </Flex>

      {description && (
        <Text variant="body" fontSize="subtitle">
          {description}
        </Text>
      )}
      <Text as="em" variant="subBody" mt={2}>
        {topics.length} topic, {getTotalNotes(notebook)} notes
      </Text>
    </Flex>
  );
}
