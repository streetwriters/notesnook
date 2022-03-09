import { formatDate } from "notes-core/utils/date";
import { useEffect, useState } from "react";
import { Flex, Text } from "rebass";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { useStore } from "../../stores/editor-store";
import { Loading, Saved, NotSaved } from "../icons";

const SAVE_STATE_ICON_MAP = {
  "-1": NotSaved,
  0: Loading,
  1: Saved,
};

function EditorFooter() {
  const [totalWords, setTotalWords] = useState(0);
  const dateEdited = useStore((store) => store.session.dateEdited);
  const id = useStore((store) => store.session.id);
  const SaveStateIcon = useStore(
    (store) => SAVE_STATE_ICON_MAP[store.session.saveState]
  );

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
      <Text
        className="selectable"
        data-test-id="editor-word-count"
        variant="subBody"
        color="bgSecondaryText"
        mr={2}
      >
        {totalWords + " words"}
      </Text>
      <Text
        className="selectable"
        variant="subBody"
        color="bgSecondaryText"
        mr={2}
      >
        {formatDate(dateEdited || Date.now())}
      </Text>
      {SaveStateIcon && <SaveStateIcon size={13} color="bgSecondaryText" />}
    </Flex>
  );
}
export default EditorFooter;
