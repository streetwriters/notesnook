import React, { useEffect, useState } from "react";
import { Input } from "@rebass/forms";
import { useStore, store, SESSION_STATES } from "../../stores/editor-store";

type TitleBoxProps = {
  readonly: boolean;
};

function TitleBox(props: TitleBoxProps) {
  const { readonly } = props;

  const state = useStore((store) => store.session.state);
  const sessionId = useStore((store) => store.session.id);
  const title = useStore((store) => store.session.title);
  const setTitle = useStore((store) => store.setTitle);

  const [currentTitle, setCurrentTitle] = useState<string>();
  const [placeholder, setPlaceholder] = useState<string>();

  useEffect(() => {
    if (state === SESSION_STATES.new) {
      setCurrentTitle("");
      setPlaceholder("");
    } else if (state === SESSION_STATES.stale) {
      setCurrentTitle(store.get().session.title);
    }
  }, [state]);

  useEffect(() => {
    setPlaceholder(title);
  }, [title]);

  return (
    <Input
      value={currentTitle}
      variant="clean"
      data-test-id="editor-title"
      className="editorTitle"
      placeholder={placeholder || "Note title"}
      width="100%"
      readOnly={readonly}
      sx={{
        p: 0,
        fontFamily: "heading",
        fontSize: ["1.625em", "1.625em", "2.625em"],
        fontWeight: "heading",
      }}
      onChange={(e) => {
        setCurrentTitle(e.target.value);
        setTitle(sessionId, e.target.value);
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return prevProps.readonly === nextProps.readonly;
});
