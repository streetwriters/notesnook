import React from "react";
import "./editor.css";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";
import { useStore as useAppStore } from "../../stores/app-store";
import TitleBox from "./title-box";
import { useStore, SESSION_STATES } from "../../stores/editor-store";
import { timeConverter } from "../../utils/time";
import { countWords } from "../../utils/string";

const TextSeperator = () => {
  return (
    <Text as="span" mx={1} mt={"-3px"} fontSize="20px">
      •
    </Text>
  );
};

function Header() {
  const title = useStore((store) => store.session.title);
  const dateEdited = useStore((store) => store.session.dateEdited);
  const id = useStore((store) => store.session.id);
  const text = useStore((store) => store.session.content.text);
  const isSaving = useStore((store) => store.session.isSaving);
  const sessionState = useStore((store) => store.session.state);
  const setSession = useStore((store) => store.setSession);
  const clearSession = useStore((store) => store.clearSession);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const toggleFocusMode = useAppStore((store) => store.toggleFocusMode);
  const toggleProperties = useStore((store) => store.toggleProperties);

  return (
    <Flex>
      <Flex flex="1 1 auto" flexDirection="column">
        <Flex
          justifyContent="center"
          alignItems="center"
          sx={{
            paddingTop: [1, 2, 2],
            paddingBottom: 0,
          }}
        >
          <Icon.ChevronLeft
            sx={{
              display: ["block", "none", "none"],
            }}
            size={30}
            onClick={() => clearSession()}
          />
          <TitleBox
            shouldFocus={sessionState === SESSION_STATES.new}
            title={title}
            setTitle={(title) =>
              setSession((state) => {
                state.session.title = title;
              })
            }
          />
        </Flex>
        <Text
          fontSize={"subBody"}
          mx={2}
          color="fontTertiary"
          sx={{
            display: "flex",
            alignItems: "center",
            marginTop: dateEdited || text?.length || id ? 0 : [0, 2, 2],
            marginBottom: dateEdited || text?.length || id ? [1, 2, 2] : 0,
          }}
        >
          {dateEdited > 0 ? (
            <>
              {timeConverter(dateEdited)}
              <TextSeperator />
            </>
          ) : null}
          {text.length > 0 ? (
            <>
              {countWords(text) + " words"}
              <TextSeperator />
            </>
          ) : null}
          {id ? <>{isSaving ? "Saving" : "Saved"}</> : null}
        </Text>
      </Flex>
      <Flex
        sx={{
          visibility: ["collapse", "visible", "visible"],
        }}
        alignItems="center"
        pr={3}
        onClick={() => {
          toggleFocusMode();
        }}
      >
        {isFocusMode ? (
          <Icon.NormalMode size={30} />
        ) : (
          <Icon.FocusMode size={30} />
        )}
      </Flex>
      {!isFocusMode && (
        <Flex alignItems="center" onClick={() => toggleProperties()} pr={3}>
          <Icon.Properties size={30} />
        </Flex>
      )}
    </Flex>
  );
}
export default Header;
