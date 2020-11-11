import React, { useRef, useState, useCallback, useEffect } from "react";
import { Flex, Text, Button } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import { db } from "../../common";
import { useStore as useEditorStore } from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";

function Unlock(props) {
  const { noteId } = props;
  const passwordRef = useRef();
  const [isWrong, setIsWrong] = useState(false);
  const openLockedSession = useEditorStore((store) => store.openLockedSession);
  const setIsEditorOpen = useAppStore((store) => store.setIsEditorOpen);

  const submit = useCallback(async () => {
    const password = passwordRef.current.value;
    try {
      const note = await db.vault.open(noteId, password);
      openLockedSession(note);
    } catch (e) {
      if (e.message === db.vault.ERRORS.wrongPassword) {
        setIsWrong(true);
      }
    }
  }, [setIsWrong, noteId, openLockedSession]);

  useEffect(() => {
    setIsEditorOpen(true);
  }, [setIsEditorOpen]);

  return (
    <Flex
      width={"100%"}
      flex="1 1 auto"
      justifyContent="center"
      alignItems="center"
    >
      <Flex flex="1" flexDirection="column" alignItems="center">
        <Flex justifyContent="center" alignItems="center">
          <Icon.Unlock size={48} color="text" />
          <Text variant="heading" ml={2} fontSize={48}>
            Unlock Note
          </Text>
        </Flex>
        <Text variant="body" color="gray">
          Please unlock this note using your vault password.
        </Text>
        <Input
          ref={passwordRef}
          autoFocus
          variant={isWrong ? "error" : "input"}
          mt={5}
          maxWidth={["95%", "95%", "50%"]}
          placeholder="Enter vault password"
          type="password"
          onKeyUp={async (e) => {
            if (e.key === "Enter") {
              await submit();
            } else {
              setIsWrong(false);
            }
          }}
        />
        {isWrong && (
          <Flex
            alignItems="center"
            justifyContent="center"
            alignSelf="flex-start"
            color="error"
            mt={2}
          >
            <Icon.Alert color="error" />
            <Text ml={1} fontSize={"body"}>
              Wrong password
            </Text>
          </Flex>
        )}
        <Button
          mt={3}
          onClick={async () => {
            await submit();
          }}
        >
          Unlock
        </Button>
      </Flex>
    </Flex>
  );
}
export default Unlock;
