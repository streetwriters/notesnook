import React, { useCallback } from "react";
import { Flex, Text, Button } from "rebass";
import { timeConverter } from "../../utils/time";
import { store as notestore } from "../../stores/note-store";
import { db } from "../../common";
import { hashNavigate } from "../../navigation";
import diff from "./differ";

function ContentToggle(props) {
  const {
    isSelected,
    isOtherSelected,
    onToggle,
    sx,
    label,
    dateEdited,
    editors,
    note,
  } = props;

  const resolveConflict = useCallback(
    async (selectedContent, otherContent) => {
      selectedContent = {
        data: selectedContent,
        type: "tiny",
        resolved: true,
      };

      await db.notes.add({
        id: note.id,
        content: selectedContent,
        conflicted: false,
      });
      if (otherContent) {
        otherContent = {
          data: otherContent,
          type: "tiny",
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
      hashNavigate(`/notes/${note.id}/edit`, true);
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
                diff.clean(selectedEditor.getContent({ format: "html" })),
                diff.clean(otherEditor.getContent({ format: "html" }))
              );
            }}
            p={1}
            px={2}
          >
            Save copy
          </Button>
        )}
        <Button
          variant="primary"
          onClick={async () => {
            if (isOtherSelected) {
              const { selectedEditor } = editors();
              await resolveConflict(
                diff.clean(selectedEditor.getContent({ format: "html" }))
              );
            } else {
              onToggle();
            }
          }}
          p={1}
          px={2}
          bg={isOtherSelected ? "error" : "primary"}
        >
          {isSelected ? "Undo" : isOtherSelected ? "Discard" : "Keep"}
        </Button>
      </Flex>
      <Flex
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
export default ContentToggle;
