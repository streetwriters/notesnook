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

import { useEffect, useMemo, useState } from "react";
import ListContainer from "../components/list-container";
import { useStore as useNbStore } from "../stores/notebook-store";
import { useStore as useAppStore } from "../stores/app-store";
import { hashNavigate, navigate } from "../navigation";
import { Button, Flex, Text } from "@theme-ui/components";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  RemoveShortcutLink,
  ShortcutLink
} from "../components/icons";
import { getTotalNotes } from "../common";
import { formatDate } from "@notesnook/core/utils/date";
import { db } from "../common/db";
import { pluralize } from "../utils/string";
import { Allotment } from "allotment";
import { Plus } from "../components/icons";
import { useStore as useNotesStore } from "../stores/note-store";
import Placeholder from "../components/placeholders";

function Notebook() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedNotebookId = useNbStore((store) => store.selectedNotebookId);
  const refresh = useNbStore((store) => store.setSelectedNotebook);
  const notebooks = useNbStore((store) => store.notebooks);

  const context = useNotesStore((store) => store.context);
  const refreshContext = useNotesStore((store) => store.refreshContext);
  const isCompact = useNotesStore((store) => store.viewMode === "compact");

  useEffect(() => {
    if (context && context.value && selectedNotebookId !== context.value.id)
      refresh(context.value.id);
  }, [selectedNotebookId, context, refresh]);

  const selectedNotebook = useMemo(
    () => db.notebooks?.notebook(selectedNotebookId)?.data,
    [selectedNotebookId, notebooks]
  );

  if (!context) return null;
  return (
    <>
      {context.type === "topic" && selectedNotebook ? (
        <Flex sx={{ alignItems: "center", mx: 2, mb: 1 }}>
          {[
            { title: "Notebooks", onClick: () => navigate(`/notebooks/`) },
            {
              title: selectedNotebook.title,
              onClick: () => navigate(`/notebooks/${selectedNotebookId}`)
            }
          ].map((crumb, index, array) => (
            <>
              <Button
                variant="anchor"
                sx={{
                  fontSize: "subBody",
                  textDecoration: "none",
                  color: "fontTertiary"
                }}
                onClick={crumb.onClick}
              >
                {crumb.title}
              </Button>
              {index === array.length - 1 ? null : (
                <ChevronRight size={18} color="fontTertiary" />
              )}
            </>
          ))}
        </Flex>
      ) : null}
      <Allotment vertical>
        <Allotment.Pane>
          <Flex variant="columnFill" sx={{ height: "100%" }}>
            <ListContainer
              type="notes"
              groupType={"notes"}
              refresh={refreshContext}
              compact={isCompact}
              context={{ ...context, notes: undefined }}
              items={context.notes}
              placeholder={<Placeholder context="notes" />}
              header={
                context?.type === "topic" ? (
                  <></>
                ) : (
                  <NotebookHeader notebook={selectedNotebook} />
                )
              }
              button={{
                content: "Make a new note",
                onClick: () =>
                  hashNavigate("/notes/create", {
                    addNonce: true,
                    replace: true
                  })
              }}
            />
          </Flex>
        </Allotment.Pane>
        <Allotment.Pane
          preferredSize={250}
          visible
          maxSize={isCollapsed ? 30 : Infinity}
        >
          <Topics
            selectedNotebook={selectedNotebook}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </Allotment.Pane>
      </Allotment>
    </>
  );
}
export default Notebook;

function Topics({ selectedNotebook, isCollapsed, setIsCollapsed }) {
  const refresh = useNbStore((store) => store.setSelectedNotebook);
  return (
    <Flex variant="columnFill" sx={{ height: "100%" }}>
      <Flex
        sx={{
          m: 1,
          ml: 2,
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer"
        }}
        onClick={() => setIsCollapsed((s) => !s)}
      >
        <Flex sx={{ alignItems: "center" }}>
          {isCollapsed ? (
            <ChevronRight size={16} color="fontTertiary" />
          ) : (
            <ChevronDown size={16} color="fontTertiary" />
          )}
          <Text variant="subBody" sx={{ fontSize: 11 }}>
            TOPICS
          </Text>
        </Flex>
        <Button
          variant="tool"
          sx={{
            p: "1px",
            bg: "transparent",
            visibility: isCollapsed ? "collapse" : "visible"
          }}
          onClick={(e) => {
            hashNavigate(`/topics/create`);
          }}
        >
          <Plus size={20} />
        </Button>
      </Flex>

      <ListContainer
        type="topics"
        groupType="topics"
        refresh={() => refresh(selectedNotebook.id)}
        items={selectedNotebook.topics}
        context={{
          notebookId: selectedNotebook.id
        }}
        placeholder={<Placeholder context="topics" />}
        header={<></>}
        button={{
          content: "Add a new topic",
          onClick: () => hashNavigate(`/topics/create`)
        }}
      />
    </Flex>
  );
}

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
    <Flex mx={2} my={2} sx={{ flexDirection: "column", minWidth: 200 }}>
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
