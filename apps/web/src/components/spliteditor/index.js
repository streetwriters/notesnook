import React, { useState, useRef, useEffect } from "react";
import { Flex, Box, Text } from "rebass";
import SimpleEditor from "./simpleeditor";
import ContentToggle from "./content-toggle";
import { store as notesStore } from "../../stores/note-store";
import { db } from "../../common/db";
import { useStore as useAppStore } from "../../stores/app-store";
import { hashNavigate } from "../../navigation";
import diff from "./differ";

function SplitEditor(props) {
  const { noteId } = props;

  const setIsEditorOpen = useAppStore((store) => store.setIsEditorOpen);
  const [conflictedNote, setConflictedNote] = useState();
  const [remoteContent, setRemoteContent] = useState();
  const [localContent, setLocalContent] = useState();
  const [htmlDiff, setHtmlDiff] = useState({});

  useEffect(() => {
    (async function () {
      await db.notes.init();
      let note = db.notes.note(noteId);
      if (!note) {
        hashNavigate(`/notes/create`, true);
        return;
      }
      notesStore.setSelectedNote(noteId);
      note = note.data;
      const content = await db.content.raw(note.contentId);
      setConflictedNote(note);
      setLocalContent({ ...content, conflicted: false });
      setRemoteContent(content.conflicted);
      setHtmlDiff(diff.diff_dual_pane(content.data, content.conflicted.data));
    })();
  }, [noteId]);

  useEffect(() => {
    setIsEditorOpen(true);
  }, [setIsEditorOpen]);

  const [localEditor, remoteEditor] = [useRef(), useRef()];
  const [selectedDelta, setSelectedDelta] = useState(-1);

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
            isSelected={selectedDelta === 0}
            isOtherSelected={selectedDelta === 1}
            onToggle={() => setSelectedDelta((s) => (s === 0 ? -1 : 0))}
            note={conflictedNote}
            editors={() => ({
              selectedEditor: remoteEditor.current.editor,
              otherEditor: localEditor.current.editor,
            })}
            sx={{
              borderStyle: "solid",
              borderWidth: 0,
              borderBottomWidth: 1,
              borderColor: "border",
              px: 2,
              pb: 1,
            }}
          />
          <Box
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
          >
            <SimpleEditor pref={localEditor} content={htmlDiff.before} />
          </Box>
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
            label="Incoming note"
            note={conflictedNote}
            isSelected={selectedDelta === 1}
            isOtherSelected={selectedDelta === 0}
            dateEdited={remoteContent.dateEdited}
            onToggle={() => setSelectedDelta((s) => (s === 1 ? -1 : 1))}
            editors={() => ({
              selectedEditor: localEditor.current.editor,
              otherEditor: remoteEditor.current.editor,
            })}
          />
          <Box px={2} overflowY="auto">
            <SimpleEditor pref={remoteEditor} content={htmlDiff.after} />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default SplitEditor;
