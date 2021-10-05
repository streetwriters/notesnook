import { useState, useEffect, useCallback } from "react";
import { Flex, Box, Text, Button } from "rebass";
import * as Icon from "../icons";
import ContentToggle from "./content-toggle";
import { store as notesStore } from "../../stores/note-store";
import { db } from "../../common/db";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useStore as useEditorStore } from "../../stores/editor-store";
import { hashNavigate } from "../../navigation";
import HTMLDiffer from "./differ";
import { showToast } from "../../utils/toast";
import "./diff.css";
import { ScrollSync, ScrollSyncPane } from "react-scroll-sync";
import { injectCssSrc, removeCss } from "../../utils/css";
import { EV, EVENTS } from "notes-core/common";

const differ = new HTMLDiffer();
var conflicts = undefined;
var currentConflict = undefined;

function navigateConflicts(prev) {
  if (!conflicts)
    conflicts = [
      ...document.querySelectorAll("span.diff-ins"),
      ...document.querySelectorAll("span.diff-del"),
    ];
  let nextConflict;
  if (currentConflict) {
    const scrollTop = document.getElementById("diffViewAfter").scrollTop;
    nextConflict = conflicts.find((conflict) =>
      prev ? conflict.offsetTop < scrollTop : conflict.offsetTop > scrollTop
    );
  } else nextConflict = conflicts[0];
  if (!nextConflict) return false;
  currentConflict = nextConflict;
  currentConflict.scrollIntoView({ block: "center" });
}

function DiffViewer(props) {
  const { noteId } = props;

  const setIsEditorOpen = useAppStore((store) => store.setIsEditorOpen);
  const theme = useThemeStore((store) => store.theme);
  const sync = useAppStore((store) => store.sync);
  const clearSession = useEditorStore((store) => store.clearSession);
  const [conflictedNote, setConflictedNote] = useState();
  const [remoteContent, setRemoteContent] = useState();
  const [localContent, setLocalContent] = useState();
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [htmlDiff, setHtmlDiff] = useState({});

  const resolveConflict = useCallback(
    async ({ toKeep, toCopy, toKeepDateEdited, dateResolved }) => {
      if (!conflictedNote) return;

      toKeep = await differ.clean(toKeep);
      if (toCopy) toCopy = await differ.clean(toCopy);

      const toKeepContent = {
        data: toKeep,
        type: "tiny",
        // HACK: we need to set remote = true so the database doesn't
        // overwrite the dateEdited of the content.
        remote: true,
        dateEdited: toKeepDateEdited,
        dateResolved,
      };

      await db.notes.add({
        id: conflictedNote.id,
        content: toKeepContent,
        conflicted: false,
      });

      if (toCopy) {
        const toCopyContent = {
          data: toCopy,
          type: "tiny",
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

      const content = await db.content.insertPlaceholders(
        await db.content.raw(note.contentId),
        "placeholder.svg"
      );
      if (!content.conflicted)
        return resolveConflict({
          toKeep: content.data,
          dateEdited: content.dateEdited,
        });

      content.conflicted = await db.content.insertPlaceholders(
        content.conflicted,
        "placeholder.svg"
      );

      setConflictedNote(note);
      setLocalContent({ ...content, conflicted: false });
      setRemoteContent(content.conflicted);

      differ
        .generate(content.data, content.conflicted.data)
        .then(async ({ before, after }) => {
          setHtmlDiff({ before, after });
          conflicts = undefined;
          currentConflict = undefined;
        });

      setHtmlDiff({ before: content.data, after: content.conflicted.data });

      conflicts = undefined;
      currentConflict = undefined;
    })();
  }, [noteId, resolveConflict]);

  useEffect(() => {
    let cssPath = "";
    if (theme === "dark")
      cssPath = "/skins/notesnook-dark/content.inline.min.css";
    else cssPath = "/skins/notesnook/content.inline.min.css";
    injectCssSrc("tmce", cssPath);
    return () => {
      removeCss("tmce");
    };
  }, [theme]);

  useEffect(() => {
    clearSession();
    setIsEditorOpen(true);
  }, [setIsEditorOpen, clearSession]);

  const [selectedContent, setSelectedContent] = useState(-1);

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
          mr={2}
          onClick={() => {
            navigateConflicts(true);
          }}
        >
          <Icon.ArrowLeft size={18} />
          <Text display={["none", "block", "block"]} fontSize="body" ml={1}>
            Prev conflict
          </Text>
        </Button>
        <Button
          display="flex"
          justifyContent="center"
          alignItems="center"
          variant="tool"
          onClick={async () => {
            setIsDownloadingImages(true);
            const event = EV.subscribe(
              EVENTS.mediaAttachmentDownloaded,
              ({ hash, src }) => {
                const elements = document.querySelectorAll(
                  `.diffviewer img[data-hash=${hash}]`
                );
                if (!elements || !elements.length) return;
                for (let element of elements) element.setAttribute("src", src);
              }
            );
            try {
              await db.content.downloadMedia(noteId, {
                data: htmlDiff.before,
                type: localContent.type,
              });
              await db.content.downloadMedia(noteId, {
                data: htmlDiff.after,
                type: remoteContent.type,
              });
            } finally {
              setIsDownloadingImages(false);
              event.unsubscribe();
            }
          }}
          disabled={isDownloadingImages}
          mr={2}
        >
          {isDownloadingImages ? (
            <Icon.Loading size={18} />
          ) : (
            <Icon.Download size={18} />
          )}
          <Text display={["none", "block", "block"]} fontSize="body" ml={1}>
            {isDownloadingImages ? "Downloading..." : "Download images"}
          </Text>
        </Button>
        <Button
          display="flex"
          justifyContent="center"
          alignItems="center"
          variant="tool"
          onClick={() => {
            navigateConflicts();
          }}
        >
          <Text display={["none", "block", "block"]} fontSize="body" mr={1}>
            Next conflict
          </Text>
          <Icon.ArrowRight size={18} />
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
                  toKeep: htmlDiff.after,
                  toCopy: saveCopy ? htmlDiff.before : null,
                  toKeepDateEdited: localContent.dateEdited,
                  dateResolved: remoteContent.dateEdited,
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
              <Box
                id="diffViewBefore"
                px={2}
                flex={1}
                overflowY="auto"
                sx={{
                  borderStyle: "solid",
                  borderWidth: 0,
                  borderRightWidth: [0, 0, 1],
                  borderBottomWidth: [1, 1, 0],
                  borderColor: "border",
                }}
                dangerouslySetInnerHTML={{ __html: htmlDiff.before }}
              />
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
                  toKeep: htmlDiff.before,
                  toCopy: saveCopy ? htmlDiff.after : null,
                  toKeepDateEdited: remoteContent.dateEdited,
                  dateResolved: remoteContent.dateEdited,
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
              <Box
                id="diffViewAfter"
                px={2}
                overflowY="auto"
                dangerouslySetInnerHTML={{ __html: htmlDiff.after }}
              />
            </ScrollSyncPane>
          </Flex>
        </Flex>
      </ScrollSync>
    </Flex>
  );
}

export default DiffViewer;
