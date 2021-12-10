import React, { useEffect, useState } from "react";
import { Flex, Text } from "rebass";
import { AppEventManager, AppEvents } from "../../common";
import { useStore } from "../../stores/editor-store";
import { timeConverter } from "../../utils/time";

function EditorFooter() {
  const [totalWords, setTotalWords] = useState(0);
  const dateEdited = useStore((store) => store.session.dateEdited);
  const id = useStore((store) => store.session.id);
  const isSaving = useStore((store) => store.session.isSaving);

  useEffect(() => {
    const updateWordCountEvent = AppEventManager.subscribe(
      AppEvents.UPDATE_WORD_COUNT,
      (count) => setTotalWords(count)
    );
    return () => {
      updateWordCountEvent.unsubscribe();
    };
  }, []);

  if (!id) return null;
  return (
    <Flex alignItems="center">
      <Text variant="subBody" color="bgSecondaryText">
        <Text as="span" data-test-id="editor-word-count">
          {totalWords + " words"}
        </Text>
        <TextSeperator />
        {timeConverter(dateEdited || Date.now())}
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
