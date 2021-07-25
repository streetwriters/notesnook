import React from "react";
import { Flex, Button } from "rebass";
import { timeConverter } from "../../utils/time";

function ContentToggle(props) {
  const {
    isSelected,
    isOtherSelected,
    onToggle,
    sx,
    label,
    dateEdited,
    editors,
    cleanDiff,
    resolveConflict,
  } = props;

  return (
    <Flex flexDirection="column" sx={sx}>
      <Flex>
        {isOtherSelected && (
          <Button
            variant="primary"
            mr={2}
            onClick={async () => {
              const { selectedEditor, otherEditor } = editors;
              await resolveConflict(
                await cleanDiff(
                  document.getElementById(selectedEditor).innerHTML
                ),
                await cleanDiff(document.getElementById(otherEditor).innerHTML),
                dateEdited
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
            console.log("isOtherSelected", isOtherSelected);
            if (isOtherSelected) {
              const { selectedEditor } = editors;
              await resolveConflict(
                await cleanDiff(
                  document.getElementById(selectedEditor).innerHTML
                ),
                null,
                dateEdited
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
        {label} | {timeConverter(dateEdited, true)}
      </Flex>
    </Flex>
  );
}
export default ContentToggle;
