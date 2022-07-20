import { useState, useEffect, useCallback } from "react";
import { Flex, Text, Button } from "rebass";
import * as Icon from "../icons";
import ContentToggle from "./content-toggle";
import { store as notesStore } from "../../stores/note-store";
import { db } from "../../common/db";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useEditorStore } from "../../stores/editor-store";
import { hashNavigate } from "../../navigation";
import { showToast } from "../../utils/toast";
import { ScrollSync, ScrollSyncPane } from "react-scroll-sync";
import { Editor } from "../editor";

function DiffViewer(props) {
  const { noteId } = props;

  const setIsEditorOpen = useAppStore((store) => store.setIsEditorOpen);
  const sync = useAppStore((store) => store.sync);
  const clearSession = useEditorStore((store) => store.clearSession);
  const [conflictedNote, setConflictedNote] = useState();
  const [remoteContent, setRemoteContent] = useState();
  const [localContent, setLocalContent] = useState();
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [htmlDiff, setHtmlDiff] = useState({});
  const [selectedContent, setSelectedContent] = useState(-1);

  const resolveConflict = useCallback(
    async ({ toKeep, toCopy, toKeepDateEdited, dateResolved }) => {
      if (!conflictedNote) return;

      await db.notes.add({
        id: conflictedNote.id,
        dateEdited: toKeepDateEdited,
        conflicted: false,
      });

      await db.content.add({
        id: conflictedNote.contentId,
        data: toKeep,
        type: "tiptap",
        dateResolved,
        conflicted: false,
        sessionId: Date.now(),
      });

      if (toCopy) {
        const toCopyContent = {
          data: toCopy,
          type: "tiptap",
        };
        await db.notes.add({
          content: toCopyContent,
          title: conflictedNote.title + " (COPY)",
        });
      }

      notesStore.refresh();
      hashNavigate(`/notes/${conflictedNote.id}/edit`, { replace: true });

      const conflictsCount = db.notes.conflicted?.length;
      if (conflictsCount) {
        showToast(
          "success",
          `Conflict resolved. ${conflictsCount} conflicts left.`
        );
      } else {
        showToast("success", "All conflicts resolved. Starting sync.");
        await sync();
      }
    },
    [conflictedNote, sync]
  );

  useEffect(() => {
    (async function () {
      await db.notes.init();
      let note = db.notes.note(noteId);
      if (!note) {
        hashNavigate(`/notes/create`, { replace: true });
        return;
      }
      notesStore.setSelectedNote(noteId);
      note = note.data;

      const content = await db.content.raw(note.contentId);
      if (!content.conflicted)
        return resolveConflict({
          toKeep: content.data,
          toKeepDateEdited: content.dateEdited,
        });

      content.conflicted = await db.content.insertPlaceholders(
        content.conflicted,
        "/placeholder.svg"
      );

      setConflictedNote(note);
      setLocalContent({ ...content, conflicted: false });
      setRemoteContent(content.conflicted);

      setHtmlDiff({ before: content.data, after: content.conflicted.data });
    })();
  }, [noteId, resolveConflict]);

  useEffect(() => {
    clearSession(false);
    setIsEditorOpen(true);
  }, [setIsEditorOpen, clearSession]);

  if (!conflictedNote || !localContent || !remoteContent) return null;
  return (
    <Flex
      className="diffviewer"
      width="100%"
      flex="1 1 auto"
      flexDirection="column"
      overflow="hidden"
    >
      <Text
        mt={2}
        variant="heading"
        textAlign="center"
        sx={{
          flexShrink: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {conflictedNote.title}
      </Text>
      <Flex alignSelf="center" justifySelf="center" mt={1}>
        <Button
          display="flex"
          justifyContent="center"
          alignItems="center"
          variant="tool"
          onClick={async () => {
            setIsDownloadingImages(true);
            try {
              await Promise.all([
                db.content.downloadMedia(noteId, {
                  data: htmlDiff.before,
                  type: localContent.type,
                }),
                db.content.downloadMedia(noteId, {
                  data: htmlDiff.after,
                  type: remoteContent.type,
                }),
              ]);
            } finally {
              setIsDownloadingImages(false);
            }
          }}
          disabled={isDownloadingImages}
          mr={2}
        >
          {isDownloadingImages ? (
            <Icon.Loading size={18} />
          ) : (
            <Icon.ImageDownload size={18} />
          )}
          <Text display={["none", "block", "block"]} fontSize="body" ml={1}>
            {isDownloadingImages ? "Downloading..." : "Load images"}
          </Text>
        </Button>
      </Flex>
      <ScrollSync>
        <Flex
          flex="1 1 auto"
          flexDirection={["column", "column", "row"]}
          overflow="hidden"
        >
          <Flex
            flexDirection="column"
            className="firstEditor"
            height={["50%", "50%", "100%"]}
            width={["100%", "100%", "50%"]}
            flex="1 1 auto"
          >
            <ContentToggle
              label="Current note"
              dateEdited={localContent.dateEdited}
              isSelected={selectedContent === 0}
              isOtherSelected={selectedContent === 1}
              onToggle={() => setSelectedContent((s) => (s === 0 ? -1 : 0))}
              resolveConflict={({ saveCopy }) => {
                resolveConflict({
                  toKeep: remoteContent.data,
                  toCopy: saveCopy ? localContent.data : null,
                  toKeepDateEdited: localContent.dateEdited,
                  dateResolved: remoteContent.dateModified,
                });
              }}
              sx={{
                borderStyle: "solid",
                borderWidth: 0,
                borderBottomWidth: 1,
                borderColor: "border",
                px: 2,
                pb: 1,
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
                  borderColor: "border",
                }}
              >
                <Editor
                  content={htmlDiff.before}
                  nonce={0}
                  options={{ readonly: true, headless: true }}
                />
              </Flex>
            </ScrollSyncPane>
          </Flex>
          <Flex
            flexDirection="column"
            className="secondEditor"
            flex="1 1 auto"
            height={["50%", "50%", "100%"]}
            width={["100%", "100%", "50%"]}
          >
            <ContentToggle
              resolveConflict={({ saveCopy }) => {
                resolveConflict({
                  toKeep: localContent.data,
                  toCopy: saveCopy ? remoteContent.data : null,
                  toKeepDateEdited: remoteContent.dateEdited,
                  dateResolved: remoteContent.dateModified,
                });
              }}
              label="Incoming note"
              isSelected={selectedContent === 1}
              isOtherSelected={selectedContent === 0}
              dateEdited={remoteContent.dateEdited}
              onToggle={() => setSelectedContent((s) => (s === 1 ? -1 : 1))}
              sx={{
                alignItems: "flex-end",
                borderStyle: "solid",
                borderWidth: 0,
                borderBottomWidth: 1,
                borderColor: "border",
                px: 2,
                pb: 1,
                pt: [1, 1, 0],
              }}
            />
            <ScrollSyncPane>
              <Flex sx={{ px: 2, overflow: "auto" }}>
                <Editor
                  content={htmlDiff.after}
                  nonce={0}
                  options={{ readonly: true, headless: true }}
                />
              </Flex>
            </ScrollSyncPane>
          </Flex>
        </Flex>
      </ScrollSync>
    </Flex>
  );
}

export default DiffViewer;
