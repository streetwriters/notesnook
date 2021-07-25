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
  const [htmlDiff, setHtmlDiff] = useState({});

  const resolveConflict = useCallback(
    async (selectedContent, otherContent, selectedContentDateEdited) => {
      if (!conflictedNote) return;

      selectedContent = {
        data: selectedContent,
        type: "tiny",
        // HACK: we need to set remote = true so the database doesn't
        // overwrite the dateEdited of the content.
        remote: true,
        dateEdited: selectedContentDateEdited,
      };

      await db.notes.add({
        id: conflictedNote.id,
        content: selectedContent,
        conflicted: false,
      });
      if (otherContent) {
        otherContent = {
          data: otherContent,
          type: "tiny",
        };
        await db.notes.add({
          content: otherContent,
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
      if (!content.conflicted) return resolveConflict(note, content.data);

      setConflictedNote(note);
      setLocalContent({ ...content, conflicted: false });
      setRemoteContent(content.conflicted);

      differ
        .generate(content.data, content.conflicted.data)
        .then(({ before, after }) => {
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
    <Flex width="100%" flex="1 1 auto" flexDirection="column" overflow="hidden">
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
              resolveConflict={resolveConflict}
              dateEdited={localContent.dateEdited}
              isSelected={selectedContent === 0}
              isOtherSelected={selectedContent === 1}
              onToggle={() => setSelectedContent((s) => (s === 0 ? -1 : 0))}
              cleanDiff={async (html) => await differ.clean(html)}
              editors={{
                selectedEditor: "diffViewAfter",
                otherEditor: "diffViewBefore",
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
              resolveConflict={resolveConflict}
              label="Incoming note"
              isSelected={selectedContent === 1}
              isOtherSelected={selectedContent === 0}
              dateEdited={remoteContent.dateEdited}
              onToggle={() => setSelectedContent((s) => (s === 1 ? -1 : 1))}
              cleanDiff={async (html) => await differ.clean(html)}
              editors={{
                selectedEditor: "diffViewBefore",
                otherEditor: "diffViewAfter",
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
