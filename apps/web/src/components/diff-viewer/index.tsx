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

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { Flex, Text, Button } from "@theme-ui/components";
import { Copy, Restore } from "../icons";
import ContentToggle from "./content-toggle";
import { store as notesStore } from "../../stores/note-store";
import { db } from "../../common/db";
import {
  ConflictedEditorSession,
  DiffEditorSession,
  useEditorStore
} from "../../stores/editor-store";
import { ScrollSync, ScrollSyncPane } from "react-scroll-sync";
import { Editor } from "../editor";
import { ContentItem, Note } from "@notesnook/core";
import { UnlockView } from "../unlock";
import { getFormattedDate } from "@notesnook/common";
import { diff } from "diffblazer";
import { strings } from "@notesnook/intl";

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
        dateResolved: conflictedContent!.dateModified
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

  if (!conflictedContent || !content) return null;

  return (
    <Flex
      ref={(el) => {
        if (el) el.classList.add("active");
      }}
      className="diffviewer"
      data-test-id="diff-viewer"
      sx={{
        flex: "1 1 auto",
        flexDirection: "column",
        width: "100%",
        overflow: "hidden"
      }}
    >
      <Text
        variant="heading"
        sx={{
          flexShrink: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "center"
        }}
      >
        {session.note.title}
      </Text>
      <Flex mt={1} sx={{ alignSelf: "center", justifySelf: "center" }}>
        {session.type === "diff" ? (
          <>
            <Button
              variant="secondary"
              data-test-id="restore-session"
              onClick={async () => {
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
              mr={2}
              sx={{
                alignItems: "center",
                justifyContent: "center",
                display: "flex"
              }}
            >
              <Restore size={18} />
              <Text ml={1}>{strings.restoreThisVersion()}</Text>
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const { closeTabs, openSession } = useEditorStore.getState();

                const noteId = await createCopy(session.note, content);

                closeTabs(session.id);

                await notesStore.refresh();
                await openSession(noteId);
              }}
              mr={2}
              sx={{
                alignItems: "center",
                justifyContent: "center",
                display: "flex"
              }}
            >
              <Copy size={18} />
              <Text ml={1}>{strings.saveACopy()}</Text>
            </Button>
          </>
        ) : null}
      </Flex>
      <ScrollSync>
        <Flex
          sx={{
            flex: "1 1 auto",
            flexDirection: ["column", "column", "row"],
            overflow: "hidden"
          }}
        >
          <Flex
            className="firstEditor"
            data-test-id="first-editor"
            sx={{
              flex: "1 1 auto",
              flexDirection: "column",
              width: ["100%", "100%", "50%"],
              height: ["50%", "50%", "100%"]
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
                    borderStyle: "solid",
                    borderWidth: 0,
                    borderBottomWidth: 1,
                    borderColor: "border",
                    px: 2,
                    pb: 1
                  }}
                />

                <ScrollSyncPane>
                  <Flex
                    sx={{
                      px: 2,
                      overflowY: "auto",
                      flex: 1,
                      borderStyle: "solid",
                      borderWidth: 0,
                      borderRightWidth: [0, 0, 1],
                      borderBottomWidth: [1, 1, 0],
                      borderColor: "border"
                    }}
                  >
                    <Editor
                      id={content.id}
                      content={() => content.data}
                      session={session}
                      nonce={content.dateEdited}
                      options={{ readonly: true, headless: true }}
                    />
                  </Flex>
                </ScrollSyncPane>
              </>
            )}
          </Flex>
          <Flex
            className="secondEditor"
            data-test-id="second-editor"
            sx={{
              flex: "1 1 auto",
              flexDirection: "column",
              width: ["100%", "100%", "50%"],
              height: ["50%", "50%", "100%"],
              borderLeft: conflictedContent.locked
                ? "1px solid var(--border)"
                : "none"
            }}
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
                    borderStyle: "solid",
                    borderWidth: 0,
                    borderBottomWidth: 1,
                    borderColor: "border",
                    px: 2,
                    pb: 1,
                    pt: [1, 1, 0]
                  }}
                />
                <ScrollSyncPane>
                  <Flex sx={{ px: 2, overflow: "auto" }}>
                    <Editor
                      id={`${conflictedContent.id}-conflicted`}
                      session={session}
                      content={() =>
                        content.locked
                          ? conflictedContent.data
                          : diff(content.data, conflictedContent.data)
                      }
                      nonce={conflictedContent.dateEdited}
                      options={{ readonly: true, headless: true }}
                    />
                  </Flex>
                </ScrollSyncPane>
              </>
            )}
          </Flex>
        </Flex>
      </ScrollSync>
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

async function createCopy(note: Note, content: ContentItem) {
  if (content.locked) {
    const contentId = await db.content.add({
      locked: true,
      data: content.data,
      type: content.type,
      noteId: note.id
    });
    return await db.notes.add({
      contentId,
      title: note.title + " (COPY)"
    });
  } else {
    return await db.notes.add({
      content: {
        type: "tiptap",
        data: content.data
      },
      title: note.title + " (COPY)"
    });
  }
}
