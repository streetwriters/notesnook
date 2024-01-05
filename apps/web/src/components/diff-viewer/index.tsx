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

import { useState } from "react";
import { Flex, Text, Button } from "@theme-ui/components";
import { Loading, ImageDownload, Copy, Restore } from "../icons";
import ContentToggle from "./content-toggle";
import { store as notesStore } from "../../stores/note-store";
import { db } from "../../common/db";
import {
  ConflictedEditorSession,
  useEditorStore
} from "../../stores/editor-store";
import { ScrollSync, ScrollSyncPane } from "react-scroll-sync";
import { Editor } from "../editor";
import { ContentItem, Note } from "@notesnook/core";
import { UnlockView } from "../unlock";
import { getFormattedDate } from "@notesnook/common";

type DiffViewerProps = { session: ConflictedEditorSession };
function DiffViewer(props: DiffViewerProps) {
  const { session } = props;

  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [selectedContent, setSelectedContent] = useState(-1);

  const [content, setContent] = useState(session.content);
  const [conflictedContent, setConflictedContent] = useState(
    content.conflicted
  );

  if (!conflictedContent) return null;

  return (
    <Flex
      className="diffviewer"
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
        {!content.locked && !conflictedContent.locked && (
          <Button
            variant="secondary"
            onClick={async () => {
              setIsDownloadingImages(true);
              try {
                await Promise.all([
                  db.content.downloadMedia(session.id, {
                    data: content.data,
                    type: content.type
                  }),
                  db.content.downloadMedia(session.id, {
                    data: conflictedContent.data,
                    type: conflictedContent.type
                  })
                ]);
              } finally {
                setIsDownloadingImages(false);
              }
            }}
            disabled={isDownloadingImages}
            mr={2}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              display: "flex"
            }}
          >
            {isDownloadingImages ? (
              <Loading size={18} />
            ) : (
              <ImageDownload size={18} />
            )}
            <Text
              ml={1}
              sx={{ fontSize: "body", display: ["none", "block", "block"] }}
            >
              {isDownloadingImages ? "Downloading..." : "Load images"}
            </Text>
          </Button>
        )}
        {session.type === "diff" ? (
          <>
            <Button
              variant="secondary"
              onClick={async () => {
                const { closeSessions, openSession } =
                  useEditorStore.getState();

                await db.noteHistory.restore(session.id);

                closeSessions(session.id, session.note.id);

                await notesStore.refresh();
                await openSession(session.note.id, true);
              }}
              mr={2}
              sx={{
                alignItems: "center",
                justifyContent: "center",
                display: "flex"
              }}
            >
              <Restore size={18} />
              <Text ml={1}>Restore this version</Text>
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const { closeSessions, openSession } =
                  useEditorStore.getState();

                const noteId = await createCopy(session.note, content);

                closeSessions(session.id);

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
              <Text ml={1}>Save a copy</Text>
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
                subtitle="Please enter the password to view this version"
                buttonTitle="Unlock"
                unlock={async (password) => {
                  const decryptedContent = await db.vault.decryptContent(
                    content,
                    session.note.id,
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
                    session.type === "diff" ? "Older version" : "Current note"
                  }
                  readonly={session.type === "diff"}
                  dateEdited={content.dateEdited}
                  isSelected={selectedContent === 0}
                  isOtherSelected={selectedContent === 1}
                  onToggle={() => setSelectedContent((s) => (s === 0 ? -1 : 0))}
                  resolveConflict={({ saveCopy }) => {
                    resolveConflict({
                      note: session.note,
                      toKeep: content.data,
                      toCopy: saveCopy ? conflictedContent : undefined,
                      toKeepDateEdited: content.dateEdited,
                      dateResolved: conflictedContent.dateModified
                    });
                  }}
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
                      nonce={0}
                      options={{ readonly: true, headless: true }}
                    />
                  </Flex>
                </ScrollSyncPane>
              </>
            )}
          </Flex>
          <Flex
            className="secondEditor"
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
                subtitle="Please enter the password to view this version"
                buttonTitle="Unlock"
                unlock={async (password) => {
                  const decryptedContent = await db.vault.decryptContent(
                    conflictedContent,
                    session.note.id,
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
                  resolveConflict={({ saveCopy }) => {
                    resolveConflict({
                      note: session.note,
                      toKeep: conflictedContent.data,
                      toCopy: saveCopy ? content : undefined,
                      toKeepDateEdited: conflictedContent.dateEdited,
                      dateResolved: conflictedContent.dateModified
                    });
                  }}
                  label={
                    session.type === "diff"
                      ? "Current version"
                      : "Incoming note"
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
                      content={() => conflictedContent.data}
                      nonce={0}
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
  toKeep: string;
  toCopy?: ContentItem;
  toKeepDateEdited: number;
  dateResolved?: number;
}) {
  await db.notes.add({
    id: note.id,
    dateEdited: toKeepDateEdited,
    conflicted: false
  });

  await db.content.add({
    id: note.contentId,
    data: toKeep,
    type: "tiptap",
    dateResolved,
    sessionId: `${Date.now()}`
  });

  if (toCopy) {
    await createCopy(note, toCopy);
  }

  await notesStore.refresh();
  useEditorStore.getState().openSession(note.id, true);
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
