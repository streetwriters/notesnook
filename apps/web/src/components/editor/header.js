import React from "react";
import "./editor.css";
import { Text } from "rebass";
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
  const title = useStore(store => store.session.title);
  const dateEdited = useStore(store => store.session.dateEdited);
  const id = useStore(store => store.session.id);
  const text = useStore(store => store.session.content.text);
  const isSaving = useStore(store => store.session.isSaving);
  const sessionState = useStore(store => store.session.state);
  const setSession = useStore(store => store.setSession);

  return (
    <>
      <TitleBox
        shouldFocus={sessionState === SESSION_STATES.new}
        title={title}
        setTitle={title =>
          setSession(state => {
            state.session.title = title;
          })
        }
        sx={{
          paddingTop: 2,
          paddingBottom: 0
        }}
      />
      <Text
        fontSize={"subBody"}
        mx={2}
        color="fontTertiary"
        sx={{
          display: "flex",
          alignItems: "center",
          marginTop: dateEdited || text.length || id.length ? 0 : 2,
          marginBottom: dateEdited || text.length || id.length ? 2 : 0
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
        {id && id.length > 0 ? <>{isSaving ? "Saving" : "Saved"}</> : null}
      </Text>
    </>
  );
}
export default Header;
