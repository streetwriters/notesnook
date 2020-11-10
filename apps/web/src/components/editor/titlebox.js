import React, { useEffect, useRef } from "react";
import "./editor.css";
import TextArea from "react-textarea-autosize";
import { useTheme } from "emotion-theming";

var changeTimeout;
function TitleBox(props) {
  const theme = useTheme();
  const { title, setTitle, changeInterval, shouldFocus } = props;
  const inputRef = useRef();

  useEffect(() => {
    if (!inputRef.current) return;
    clearTimeout(changeTimeout);
    inputRef.current.value = title;
  }, [title]);

  useEffect(() => {
    if (shouldFocus) inputRef.current.focus();
  }, [shouldFocus]);

  return (
    <TextArea
      ref={inputRef}
      autoFocus={shouldFocus}
      className="editorTitle"
      data-test-id="editor-title"
      placeholder="Untitled"
      maxLength={240}
      style={{
        backgroundColor: "transparent",
        fontFamily: theme.fonts["heading"],
        fontSize: 42,
        fontWeight: theme.fontWeights["heading"],
        resize: "none",
        paddingRight: theme.space[2],
        paddingLeft: theme.space[2],
        border: "none",
        color: theme.colors["text"],
        width: "100%",
      }}
      onChange={(e) => {
        clearTimeout(changeTimeout);
        changeTimeout = setTimeout(
          setTitle.bind(this, e.target.value),
          changeInterval
        );
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return (
    prevProps.shouldFocus === nextProps.shouldFocus &&
    prevProps.title === nextProps.title
  );
});
