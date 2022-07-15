import { formatDate } from "@streetwriters/notesnook-core/utils/date";
import { Flex, Text } from "rebass";
import { useStore } from "../../stores/editor-store";
import { Loading, Saved, NotSaved } from "../icons";
import { useNoteStatistics } from "./context";

const SAVE_STATE_ICON_MAP = {
  "-1": NotSaved,
  0: Loading,
  1: Saved,
};

function EditorFooter() {
  const { words } = useNoteStatistics();
  const dateEdited = useStore((store) => store.session.dateEdited);
  const id = useStore((store) => store.session.id);
  const SaveStateIcon = useStore(
    (store) => SAVE_STATE_ICON_MAP[store.session.saveState]
  );

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
        {words.total + " words"}
        {words.selected ? ` (${words.selected} selected)` : ""}
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
