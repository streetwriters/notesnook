import React, { useCallback } from "react";
import { Flex, Text, Button } from "rebass";
import { timeConverter } from "../../utils/time";
import DeltaTransformer from "quill/core/delta";
import { store as notestore } from "../../stores/note-store";
import { db } from "../../common";
import { setHashParam } from "../../utils/useHashParam";

const deltaTransformer = new DeltaTransformer();

function DeltaToggle(props) {
  const {
    isSelected,
    isOtherSelected,
    onToggle,
    direction,
    sx,
    label,
    dateEdited,
    editors,
    note,
  } = props;

  const resolveConflict = useCallback(
    async (selectedContent, otherContent) => {
      selectedContent.delta = {
        data: { ops: selectedContent.delta },
        resolved: true,
      };
      await db.notes.add({
        id: note.id,
        content: selectedContent,
        conflicted: false,
      });
      if (otherContent) {
        otherContent.delta = {
          data: { ops: otherContent.delta },
        };
        await db.notes.add({
          ...note,
          content: otherContent,
          id: undefined,
          dateCreated: undefined,
          dateEdited: undefined,
          conflicted: false,
          title: note.title + " (DUPLICATE)",
        });
      }
      notestore.refresh();
      setHashParam({ note: note.id });
    },
    [note]
  );

  return (
    <Flex flexDirection="column" sx={sx}>
      <Flex>
        {isOtherSelected && (
          <Button
            variant="primary"
            mr={2}
            onClick={async () => {
              const { selectedEditor, otherEditor } = editors();
              await resolveConflict(
                {
                  delta: deltaTransformer.cleanDifference(
                    selectedEditor.getContents()
                  ),
                  text: selectedEditor.getText(),
                },
                {
                  delta: deltaTransformer.cleanDifference(
                    otherEditor.getContents()
                  ),
                  text: otherEditor.getText(),
                }
              );
            }}
          >
            Save copy
          </Button>
        )}
        <Button
          variant="primary"
          onClick={async () => {
            if (isOtherSelected) {
              const { selectedEditor } = editors();
              await resolveConflict({
                delta: deltaTransformer.cleanDifference(
                  selectedEditor.getContents()
                ),
                text: selectedEditor.getText(),
              });
            } else {
              onToggle();
            }
          }}
          bg={isOtherSelected ? "error" : "primary"}
        >
          {isSelected ? "Undo" : isOtherSelected ? "Discard" : "Keep"}
        </Button>
      </Flex>
      <Flex
        flexDirection={direction}
        alignItems="center"
        mt={1}
        sx={{ fontSize: "subBody", color: "fontTertiary" }}
      >
        {label}
        {/* eslint-disable-next-line jsx-a11y/accessible-emoji */}
        <Text as="span" role="img" fontSize={7} mx={1}>
          ⚫
        </Text>
        {timeConverter(dateEdited, true)}
      </Flex>
    </Flex>
  );
}
export default DeltaToggle;
