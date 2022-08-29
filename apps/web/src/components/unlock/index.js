import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo
} from "react";
import { Flex, Text, Button } from "@streetwriters/rebass";
import * as Icon from "../icons";
import { db } from "../../common/db";
import { useStore as useEditorStore } from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import Field from "../field";
import { showToast } from "../../utils/toast";

function Unlock(props) {
  const { noteId } = props;
  const note = useMemo(() => db.notes.note(noteId)?.data, [noteId]);
  const passwordRef = useRef();
  const [isWrong, setIsWrong] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const openLockedSession = useEditorStore((store) => store.openLockedSession);
  const clearSession = useEditorStore((store) => store.clearSession);
  const setIsEditorOpen = useAppStore((store) => store.setIsEditorOpen);
  const setSelectedNote = useNoteStore((store) => store.setSelectedNote);

  const submit = useCallback(async () => {
    setIsUnlocking(true);
    const password = passwordRef.current.value;
    try {
      if (!password) return;
      const note = await db.vault.open(noteId, password);
      openLockedSession(note);
    } catch (e) {
      if (e.message.includes("ciphertext cannot be decrypted using that key")) {
        setIsWrong(true);
      } else {
        showToast("error", "Cannot unlock note: " + e);
        console.error(e);
      }
    } finally {
      setIsUnlocking(false);
    }
  }, [setIsWrong, noteId, openLockedSession]);

  useEffect(() => {
    clearSession(false);
    setIsEditorOpen(true);
    setTimeout(() => setSelectedNote(noteId));
  }, [clearSession, setIsEditorOpen, setSelectedNote, noteId]);

  return (
    <Flex
      flex="1"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      mx={2}
    >
      <Flex
        justifyContent="center"
        alignItems="center"
        flexDirection={"column"}
      >
        <Icon.Lock size={100} sx={{ opacity: 0.2 }} />
        <Text
          data-test-id="unlock-note-title"
          variant="heading"
          fontSize={36}
          mx={100}
          mt={25}
          textAlign="center"
        >
          {note?.title || "Open note"}
        </Text>
      </Flex>
      <Text
        variant="subheading"
        color="fontTertiary"
        mt={20}
        textAlign="center"
      >
        Please enter the password to unlock this note
      </Text>
      <Field
        id="vaultPassword"
        data-test-id="unlock-note-password"
        inputRef={passwordRef}
        autoFocus
        sx={{ mt: 2, width: ["95%", "95%", "50%"] }}
        placeholder="Enter password"
        type="password"
        onKeyUp={async (e) => {
          if (e.key === "Enter") {
            await submit();
          } else if (isWrong) {
            setIsWrong(false);
          }
        }}
      />
      {isWrong && (
        <Flex
          alignItems="center"
          justifyContent="center"
          alignSelf="flex-center"
          color="error"
          mt={2}
        >
          <Icon.Alert color="error" size={12} />
          <Text ml={1} fontSize={"body"}>
            Wrong password
          </Text>
        </Flex>
      )}
      <Button
        mt={3}
        variant="primary"
        data-test-id="unlock-note-submit"
        disabled={isUnlocking}
        sx={{ borderRadius: 100, px: 30 }}
        onClick={async () => {
          await submit();
        }}
      >
        {isUnlocking ? "Unlocking..." : "Open note"}
      </Button>
    </Flex>
  );
}
export default Unlock;
