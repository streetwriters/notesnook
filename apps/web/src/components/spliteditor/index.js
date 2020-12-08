import React, { useState, useRef, useEffect } from "react";
import { Flex, Box, Text } from "rebass";
import SimpleEditor from "./simpleeditor";
import DeltaTransformer from "quill/core/delta";
import DeltaToggle from "./deltatoggle";
import { store as notesStore } from "../../stores/note-store";
import { db } from "../../common";
import { setHashParam } from "../../utils/useHashParam";

const deltaTransformer = new DeltaTransformer();

function SplitEditor(props) {
  const { diffId } = props;

  const [conflictedNote, setConflictedNote] = useState();
  const [remoteDelta, setRemoteDelta] = useState();
  const [localDelta, setLocalDelta] = useState();

  useEffect(() => {
    let note = db.notes.note(diffId);
    if (!note) {
      setHashParam({ note: 0 });
      return;
    }
    notesStore.setSelectedNote(diffId);
    note = note.data;
    (async function () {
      const delta = await db.content.raw(note.contentId);
      setConflictedNote(note);
      setLocalDelta({ ...delta, conflicted: false });
      setRemoteDelta(delta.conflicted);
    })();
  }, [diffId]);

  const [localEditor, remoteEditor] = [useRef(), useRef()];
  const [selectedDelta, setSelectedDelta] = useState(-1);

  if (!conflictedNote || !localDelta || !remoteDelta) return null;
  return (
    <Flex width="100%" flex="1 1 auto" flexDirection="column">
      <Flex
        sx={{
          borderBottom: "1px solid",
          borderColor: "border",
          position: "relative",
        }}
        justifyContent="stretch"
        alignItems="center"
        p={2}
      >
        <DeltaToggle
          sx={{ flex: "0.1 1 auto" }}
          label="Current note"
          dateEdited={localDelta.dateEdited}
          isSelected={selectedDelta === 0}
          isOtherSelected={selectedDelta === 1}
          onToggle={() => setSelectedDelta((s) => (s === 0 ? -1 : 0))}
          note={conflictedNote}
          editors={() => ({
            selectedEditor: remoteEditor.current.quill,
            otherEditor: localEditor.current.quill,
          })}
        />
        <Text
          flex="0.8 1 auto"
          variant="heading"
          textAlign="center"
          sx={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {conflictedNote.title}
        </Text>
        <DeltaToggle
          sx={{ flex: "0.1 1 auto", alignItems: "flex-end" }}
          direction="row-reverse"
          label="Incoming note"
          note={conflictedNote}
          isSelected={selectedDelta === 1}
          isOtherSelected={selectedDelta === 0}
          dateEdited={remoteDelta.dateEdited}
          onToggle={() => setSelectedDelta((s) => (s === 1 ? -1 : 1))}
          editors={() => ({
            selectedEditor: localEditor.current.quill,
            otherEditor: remoteEditor.current.quill,
          })}
        />
      </Flex>
      <Flex flex="1 1 auto">
        <Box
          className="firstEditor"
          width="50%"
          flex="1 1 auto"
          sx={{ borderRight: "1px solid", borderColor: "border" }}
          px={2}
        >
          <SimpleEditor
            pref={localEditor}
            container=".firstEditor"
            id="firstQuill"
            delta={deltaTransformer.highlightDifference(
              localDelta.data,
              remoteDelta.data,
              "#FDB0C0"
            )}
          />
        </Box>
        <Box className="secondEditor" flex="1 1 auto" width="50%" px={2}>
          <SimpleEditor
            pref={remoteEditor}
            container=".secondEditor"
            id="secondQuill"
            delta={deltaTransformer.highlightDifference(
              remoteDelta.data,
              localDelta.data,
              "#CAFFFB"
            )}
          />
        </Box>
      </Flex>
    </Flex>
  );
}

export default SplitEditor;
