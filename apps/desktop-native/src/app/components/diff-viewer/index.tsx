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

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { getFormattedDate } from "@notesnook/common";
import type { ContentItem, Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Button, Flex, ScrollContainer, Text } from "@ui";
import { Copy, Restore } from "../icons";
import ContentToggle from "./content-toggle";
import { UnlockView } from "../unlock";
import { store as notesStore } from "../../stores/note-store";
import { db } from "../../common/db";
import {
  useEditorStore,
  type ConflictedEditorSession,
  type DiffEditorSession
} from "../../stores/editor-store";

function ReadonlyContent(props: { id: string }) {
  return (
    <Flex testID={`readonly-editor-${props.id}`} sx={{ flex: 1, p: 2 }}>
      <Text sx={{ color: "paragraph-secondary" }}>
        The editor is not implemented on desktop yet
      </Text>
    </Flex>
  );
}

type DiffViewerProps = { session: ConflictedEditorSession | DiffEditorSession };
function DiffViewer(props: DiffViewerProps) {
  const { session } = props;

  const [selectedContent, setSelectedContent] = useState(-1);
  const [content, setContent] = useState(session.content);
  const [conflictedContent, setConflictedContent] = useState(
    content?.conflicted
  );

  useEffect(() => {
    setContent(session.content);
    setConflictedContent(session.content?.conflicted);
  }, [session.content]);

  const onResolveContent = useCallback(
    (saveCopy: boolean) => {
      if (!conflictedContent) return;

      const toKeep =
        selectedContent === 1 ? session.content?.conflicted : session.content;
      const toCopy =
        selectedContent === 1 ? session.content : session.content?.conflicted;
      if (!toKeep) return;
      resolveConflict({
        note: session.note,
        toKeep,
        toCopy: saveCopy ? toCopy : undefined,
        toKeepDateEdited: toKeep.dateEdited,
        dateResolved: conflictedContent.dateModified
      });
    },
    [conflictedContent, selectedContent, session.content, session.note]
  );

  useLayoutEffect(() => {
    setConflictedContent((c) => {
      if (c?.dateEdited === session.content?.conflicted?.dateEdited) return c;
      return session.content?.conflicted;
    });
  }, [session]);

  const title =
    session.type === "diff" && session.oldTitle
      ? `${session.oldTitle} \u2192 ${session.note.title}`
      : session.note.title;

  return (
    <Flex
      testID="diff-viewer"
      sx={{
        flex: 1,
        flexDirection: "column",
        width: "100%",
        overflow: "hidden"
      }}
    >
      <Text
        variant="heading"
        numberOfLines={1}
        sx={{ flexShrink: 0, textAlign: "center", pt: 10 }}
      >
        {title}
      </Text>
      <Flex
        sx={{
          flexDirection: "row",
          mt: 1,
          alignSelf: "center",
          justifyContent: "center"
        }}
      >
        {session.type === "diff" ? (
          <>
            <Button
              variant="secondary"
              testID="restore-session"
              onPress={async () => {
                const { closeTabs, openSession, getSessionsForNote } =
                  useEditorStore.getState();

                await db.noteHistory.restore(session.historySessionId);

                closeTabs(
                  session.id,
                  ...getSessionsForNote(session.note.id).map((s) => s.id)
                );

                await notesStore.refresh();
                await openSession(session.note.id, { force: true });
              }}
              sx={{
                flexDirection: "row",
                mr: 2,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Restore size={18} color="icon" />
              <Text sx={{ ml: 1 }}>{strings.restoreThisVersion()}</Text>
            </Button>
            {!content || !conflictedContent ? null : (
              <Button
                variant="secondary"
                onPress={async () => {
                  const { closeTabs, openSession } = useEditorStore.getState();

                  const noteId = await createCopy(
                    session.note,
                    content,
                    session.oldTitle
                  );

                  closeTabs(session.id);

                  await notesStore.refresh();
                  await openSession(noteId);
                }}
                sx={{
                  flexDirection: "row",
                  mr: 2,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Copy size={18} color="icon" />
                <Text sx={{ ml: 1 }}>{strings.saveACopy()}</Text>
              </Button>
            )}
            <Button
              variant="errorSecondary"
              onPress={() => {
                const { openSession } = useEditorStore.getState();
                openSession(session.note.id, { force: true });
              }}
            >
              {strings.close()}
            </Button>
          </>
        ) : null}
      </Flex>
      {!conflictedContent || !content ? (
        <Text
          variant="body"
          sx={{
            px: 2,
            py: 1,
            my: 1,
            borderTop: "1px solid",
            borderTopColor: "border"
          }}
        >
          {strings.noContent()}
        </Text>
      ) : (
        <Flex
          sx={{
            flex: 1,
            flexDirection: ["column", "column", "row"],
            overflow: "hidden"
          }}
        >
          <Flex
            testID="first-editor"
            sx={{
              flex: 1,
              flexDirection: "column",
              borderRight: "1px solid",
              borderRightColor: "border"
            }}
          >
            {content.locked ? (
              <UnlockView
                title={getFormattedDate(content.dateEdited)}
                subtitle={strings.enterPasswordToUnlockVersion()}
                buttonTitle={strings.unlock()}
                unlock={async (password) => {
                  const decryptedContent = await db.vault.decryptContent(
                    content,
                    password
                  );
                  setContent({
                    ...content,
                    ...decryptedContent,
                    locked: false
                  });
                }}
              />
            ) : (
              <>
                <ContentToggle
                  label={
                    session.type === "diff"
                      ? strings.olderVersion()
                      : strings.currentNote()
                  }
                  readonly={session.type === "diff"}
                  dateEdited={content.dateEdited}
                  isSelected={selectedContent === 0}
                  isOtherSelected={selectedContent === 1}
                  onToggle={() => setSelectedContent((s) => (s === 0 ? -1 : 0))}
                  resolveConflict={onResolveContent}
                  sx={{
                    borderBottom: "1px solid",
                    borderBottomColor: "border",
                    px: 2,
                    pb: 1
                  }}
                />
                <ScrollContainer>
                  <ReadonlyContent id={content.id} />
                </ScrollContainer>
              </>
            )}
          </Flex>
          <Flex
            testID="second-editor"
            sx={{ flex: 1, flexDirection: "column" }}
          >
            {conflictedContent.locked ? (
              <UnlockView
                title={getFormattedDate(conflictedContent.dateEdited)}
                subtitle={strings.enterPasswordToUnlockVersion()}
                buttonTitle={strings.unlock()}
                unlock={async (password) => {
                  const decryptedContent = await db.vault.decryptContent(
                    conflictedContent,
                    password
                  );
                  setConflictedContent({
                    ...conflictedContent,
                    ...decryptedContent,
                    locked: false
                  });
                }}
              />
            ) : (
              <>
                <ContentToggle
                  readonly={session.type === "diff"}
                  resolveConflict={onResolveContent}
                  label={
                    session.type === "diff"
                      ? strings.currentNote()
                      : strings.incomingNote()
                  }
                  isSelected={selectedContent === 1}
                  isOtherSelected={selectedContent === 0}
                  dateEdited={conflictedContent.dateEdited}
                  onToggle={() => setSelectedContent((s) => (s === 1 ? -1 : 1))}
                  sx={{
                    alignItems: "flex-end",
                    borderBottom: "1px solid",
                    borderBottomColor: "border",
                    px: 2,
                    pb: 1,
                    pt: [1, 1, 0]
                  }}
                />
                <ScrollContainer>
                  <ReadonlyContent id={`${conflictedContent.id}-conflicted`} />
                </ScrollContainer>
              </>
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}

export default DiffViewer;

async function resolveConflict({
  note,
  toKeep,
  toCopy,
  toKeepDateEdited,
  dateResolved
}: {
  note: Note;
  toKeep: ContentItem;
  toCopy?: ContentItem;
  toKeepDateEdited: number;
  dateResolved?: number;
}) {
  await db.content.add({
    id: note.contentId,
    dateResolved,
    sessionId: `${Date.now()}`,
    ...(toKeep.locked
      ? { data: toKeep.data, locked: true }
      : { data: toKeep.data, locked: false })
  });

  await db.notes.add({
    id: note.id,
    dateEdited: toKeepDateEdited,
    conflicted: false
  });

  if (toCopy) {
    await createCopy(note, toCopy);
  }

  await notesStore.refresh();
}

async function createCopy(note: Note, content: ContentItem, title?: string) {
  if (content.locked) {
    const contentId = await db.content.add({
      locked: true,
      data: content.data,
      type: content.type,
      noteId: note.id
    });
    return await db.notes.add({
      contentId,
      title: title || note.title + " (COPY)"
    });
  } else {
    return await db.notes.add({
      content: {
        type: "tiptap",
        data: content.data
      },
      title: title || note.title + " (COPY)"
    });
  }
}
