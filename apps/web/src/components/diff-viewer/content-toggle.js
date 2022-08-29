import { formatDate } from "@streetwriters/notesnook-core/utils/date";
import { Flex, Button } from "@streetwriters/rebass";

function ContentToggle(props) {
  const {
    isSelected,
    isOtherSelected,
    onToggle,
    sx,
    label,
    dateEdited,
    resolveConflict
  } = props;

  return (
    <Flex flexDirection="column" sx={sx}>
      <Flex>
        {isOtherSelected && (
          <Button
            variant="primary"
            mr={2}
            onClick={() => resolveConflict({ saveCopy: true })}
            p={1}
            px={2}
          >
            Save copy
          </Button>
        )}
        <Button
          variant="primary"
          onClick={() => {
            if (isOtherSelected) {
              resolveConflict({ saveCopy: false });
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
        {label} | {formatDate(dateEdited, true)}
      </Flex>
    </Flex>
  );
}
export default ContentToggle;
