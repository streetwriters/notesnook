import React from "react";
import { Flex, Text } from "rebass";
import { useStore } from "../../stores/editor-store";
import { timeConverter } from "../../utils/time";

function EditorFooter() {
  const dateEdited = useStore((store) => store.session.dateEdited);
  const id = useStore((store) => store.session.id);
  const totalWords = useStore((store) => store.session.totalWords);
  const isSaving = useStore((store) => store.session.isSaving);
  if (!id) return null;
  return (
    <Flex alignItems="center">
      <Text variant="subBody" color="bgSecondaryText">
        {totalWords + " words"}
        <TextSeperator />
        {timeConverter(dateEdited)}
        <TextSeperator />
        {isSaving ? "Saving" : "Saved"}
      </Text>
    </Flex>
  );
}
export default EditorFooter;

const TextSeperator = () => {
  return (
    <Text as="span" mx={1}>
      •
    </Text>
  );
};
