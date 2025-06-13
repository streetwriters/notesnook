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

import ListContainer from "../components/list-container";
import {
  notesFromContext,
  useStore as useNotesStore
} from "../stores/note-store";
import Placeholder from "../components/placeholders";
import { useSearch } from "../hooks/use-search";
import { db } from "../common/db";
import { handleDrop } from "../common/drop-handler";
import { useEditorStore } from "../stores/editor-store";
import { ListLoader } from "../components/loaders/list-loader";
import Field from "../components/field";
import { Button, Flex, Text } from "@theme-ui/components";
import { useStore } from "../stores/notebook-store";
import { useEffect, useRef, useState } from "react";
import { EV, EVENTS } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { showToast } from "../utils/toast";
import { ErrorText } from "../components/error-text";

type NotesProps = { header?: JSX.Element };
function Notes(props: NotesProps) {
  const { header } = props;
  const context = useNotesStore((store) => store.context);
  const contextNotes = useNotesStore((store) => store.contextNotes);
  const refreshContext = useNotesStore((store) => store.refreshContext);
  const type =
    context?.type === "favorite"
      ? "favorites"
      : context?.type === "archive"
      ? "archive"
      : "notes";
  const isCompact = useNotesStore((store) => store.viewMode === "compact");
  const filteredItems = useSearch(
    context?.type === "notebook" ? "notebook" : "notes",
    async (query, sortOptions) => {
      if (!context || !contextNotes) return;
      const notes = notesFromContext(context);
      return await db.lookup.notesWithHighlighting(query, sortOptions, notes);
    },
    [context, contextNotes]
  );
  const [showUnlockNotebookPreview, setShowUnlockNotebookPreview] = useState<
    null | boolean
  >(null);

  useEffect(() => {
    let cancel = false;

    if (context?.type !== "notebook") {
      setShowUnlockNotebookPreview(false);
      return;
    }

    (async () => {
      if (context?.type !== "notebook") {
        setShowUnlockNotebookPreview(false);
        return;
      }
      const notebook = await db.notebooks.notebook(context.id);
      const showLockPreview = db.notebooks.cache.lockOpenedNotebooks.includes(
        context.id
      )
        ? false
        : Boolean(notebook?.password);
      if (!cancel) {
        setShowUnlockNotebookPreview(showLockPreview);
      }
    })();

    const { unsubscribe: notebookLockOpenedEventUnsub } = EV.subscribe(
      EVENTS.notebookLockOpened,
      (notebookId) => {
        if (notebookId === context.id) {
          setShowUnlockNotebookPreview(false);
        }
      }
    );
    const { unsubscribe: notebooksLockedEventUnsub } = EV.subscribe(
      EVENTS.notebooksLocked,
      async () => {
        if (context?.type === "notebook") {
          const notebook = await db.notebooks.notebook(context.id!);
          if (notebook?.password) {
            setShowUnlockNotebookPreview(true);
          }
        }
      }
    );

    return () => {
      cancel = true;
      notebookLockOpenedEventUnsub();
      notebooksLockedEventUnsub();
    };
  }, [context]);

  if (!context || !contextNotes || showUnlockNotebookPreview == null)
    return <ListLoader />;

  if (showUnlockNotebookPreview) {
    return (
      <>
        {header}
        <UnlockNotebookPreview notebookId={context.id} />
      </>
    );
  }

  return (
    <ListContainer
      type={type}
      group={type}
      refresh={refreshContext}
      compact={isCompact}
      context={context}
      items={filteredItems || contextNotes}
      isSearching={!!filteredItems}
      onDrop={(e) => handleDrop(e.dataTransfer, context)}
      placeholder={
        <Placeholder
          context={
            filteredItems
              ? "search"
              : context.type === "favorite"
              ? "favorites"
              : context.type === "archive"
              ? "archive"
              : context.type === "monographs"
              ? "monographs"
              : "notes"
          }
        />
      }
      button={{
        onClick: () => useEditorStore.getState().newSession()
      }}
      header={header}
    />
  );
}
export default Notes;

function UnlockNotebookPreview({ notebookId }: { notebookId: string }) {
  const [isWrong, setIsWrong] = useState(false);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  async function submit() {
    if (!passwordRef.current?.value) return;

    const password = passwordRef.current.value;
    try {
      const valid = await db.notebooks.openLock(notebookId, password);
      if (valid) {
        useStore.getState().refresh();
      } else {
        setIsWrong(true);
      }
    } catch (e) {
      showToast("error", `${strings.couldNotUnlock()}: ` + e);
      console.error(e);
    }
  }

  return (
    <Flex
      mx={2}
      sx={{
        flex: "1",
        flexDirection: "column"
      }}
    >
      <Text variant="heading" mt={25} sx={{ textAlign: "center" }}>
        Open notebook
      </Text>
      <Field
        id="notebookPassword"
        data-test-id="unlock-notebook-password"
        inputRef={passwordRef}
        autoFocus
        placeholder={"Enter password"}
        type="password"
        onKeyUp={async (e) => {
          if (e.key === "Enter") {
            await submit();
          } else if (isWrong) {
            setIsWrong(false);
          }
        }}
      />
      {isWrong && <ErrorText error="Wrong password" />}
      <Button
        mt={3}
        variant="accent"
        data-test-id="unlock-notebook-submit"
        sx={{ borderRadius: 100, px: 30 }}
        onClick={submit}
      >
        Unlock
      </Button>
    </Flex>
  );
}
