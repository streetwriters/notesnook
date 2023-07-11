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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  ShortcutLink,
  SortAsc
} from "../components/icons";
import { getTotalNotes } from "@notesnook/common";
import { pluralize } from "@notesnook/common";
import { Allotment } from "allotment";
import { Plus } from "../components/icons";
import { useStore as useNotesStore } from "../stores/note-store";
import Placeholder from "../components/placeholders";
import { showSortMenu } from "../components/group-header";
import { db } from "../common/db";
import { groupArray } from "@notesnook/core/utils/grouping";
import { getFormattedDate } from "@notesnook/common";
import { ThemeVariant } from "../components/theme-provider";

function Notebook() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  /**
   * @type {React.RefObject<import("allotment").AllotmentHandle>}
   */
  const paneRef = useRef(null);
  /**
   * @type {React.RefObject<[number, number]>}
   */
  const sizes = useRef([]);

  const selectedNotebook = useNbStore((store) => store.selectedNotebook);
  const refresh = useNbStore((store) => store.setSelectedNotebook);

  const context = useNotesStore((store) => store.context);
  const refreshContext = useNotesStore((store) => store.refreshContext);
  const isCompact = useNotesStore((store) => store.viewMode === "compact");

  useEffect(() => {
    if (
      context &&
      context.value &&
      selectedNotebook &&
      selectedNotebook.id !== context.value.id
    )
      refresh(context.value.id);
  }, [selectedNotebook, context, refresh]);

  const toggleCollapse = useCallback((isCollapsed) => {
    if (!paneRef.current || !sizes.current) return;

    if (!isCollapsed) {
      if (sizes.current[1] < 60) {
        paneRef.current.reset();
      } else {
        paneRef.current.resize(sizes.current);
      }
    }
  }, []);

  const notes = useMemo(
    () =>
      groupArray(context?.notes || [], db.settings.getGroupOptions("notes")),
    [context?.notes]
  );

  useEffect(() => {
    toggleCollapse(isCollapsed);
  }, [isCollapsed, toggleCollapse]);

  if (!context) return null;
  return (
    <>
      {context.type === "topic" && selectedNotebook ? (
        <ThemeVariant variant="secondary">
          <Flex sx={{ alignItems: "center", mx: 2, mb: 1 }}>
            {[
              { title: "Notebooks", onClick: () => navigate(`/notebooks/`) },
              {
                title: selectedNotebook.title,
                onClick: () => navigate(`/notebooks/${selectedNotebook.id}`)
              }
            ].map((crumb, index, array) => (
              <>
                <Button
                  variant="anchor"
                  sx={{
                    fontSize: "subBody",
                    textDecoration: "none",
                    color: "paragraph"
                  }}
                  onClick={crumb.onClick}
                >
                  {crumb.title}
                </Button>
                {index === array.length - 1 ? null : <ChevronRight size={18} />}
              </>
            ))}
          </Flex>
        </ThemeVariant>
      ) : null}
      <Allotment
        ref={paneRef}
        vertical
        onChange={(paneSizes) => {
          const [_, topicsPane] = paneSizes;
          if (topicsPane > 30 && !isCollapsed) sizes.current = paneSizes;
        }}
        onDragEnd={([_, topicsPane]) => {
          if (topicsPane < 35 && !isCollapsed) {
            setIsCollapsed(true);
          }
        }}
      >
        <Allotment.Pane>
          <Flex variant="columnFill" sx={{ height: "100%" }}>
            <ListContainer
              type="notes"
              groupType={"notes"}
              refresh={refreshContext}
              compact={isCompact}
              context={{ ...context, notes: undefined }}
              items={notes}
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
            onClick={() => {
              setIsCollapsed((isCollapsed) => !isCollapsed);
            }}
          />
        </Allotment.Pane>
      </Allotment>
    </>
  );
}
export default Notebook;

function Topics({ selectedNotebook, isCollapsed, onClick }) {
  const refresh = useNbStore((store) => store.setSelectedNotebook);
  const topics = useNbStore((store) => store.selectedNotebookTopics);

  // sometimes the onClick event is triggered on dragEnd
  // which shouldn't happen. To prevent that we make sure
  // that onMouseDown & onMouseUp events got called.
  const mouseEventCounter = useRef(0);

  if (!selectedNotebook) return null;
  return (
    <Flex id="topics" variant="columnFill" sx={{ height: "100%" }}>
      <Flex
        sx={{
          m: 1,
          ml: 2,
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer"
        }}
        onMouseDown={() => {
          mouseEventCounter.current = 1;
        }}
        onMouseUp={() => {
          mouseEventCounter.current++;
        }}
        onClick={() => {
          if (mouseEventCounter.current === 2) onClick();
          mouseEventCounter.current = 0;
        }}
      >
        <Flex sx={{ alignItems: "center" }}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <Text variant="subBody" sx={{ fontSize: 11 }}>
            TOPICS
          </Text>
        </Flex>
        <Flex sx={{ alignItems: "center" }}>
          <Button
            variant="tool"
            data-test-id="topics-sort-button"
            sx={{
              p: "3.5px",
              bg: "transparent",
              visibility: isCollapsed ? "collapse" : "visible"
            }}
            onClick={(e) => {
              e.stopPropagation();
              showSortMenu("topics", () => refresh(selectedNotebook.id));
            }}
          >
            <SortAsc size={15} />
          </Button>
          <Button
            variant="tool"
            sx={{
              p: "1px",
              bg: "transparent",
              visibility: isCollapsed ? "collapse" : "visible"
            }}
            onClick={(e) => {
              e.stopPropagation();
              hashNavigate(`/topics/create`);
            }}
          >
            <Plus size={20} />
          </Button>
        </Flex>
      </Flex>

      <ListContainer
        type="topics"
        items={topics}
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
      <ThemeVariant variant="secondary">
        <Text variant="subBody">{getFormattedDate(dateEdited)}</Text>
      </ThemeVariant>
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
      <ThemeVariant variant="secondary">
        <Text as="em" variant="subBody" mt={2}>
          {pluralize(topics.length, "topic")}, {pluralize(totalNotes, "note")}
        </Text>
      </ThemeVariant>
    </Flex>
  );
}
