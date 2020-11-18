import React, { useCallback, useEffect, useRef, useState } from "react";
import "./editor.css";
import { Text, Flex } from "rebass";
import { Input } from "@rebass/forms";

var changeTimeout;
function TitleBox(props) {
  const { title, setTitle, changeInterval, shouldFocus } = props;

  const [height, setHeight] = useState(60);
  const inputRef = useRef();

  const resize = useCallback(() => {
    const textarea = document.querySelector(".editorTitle");
    const dummy = document.querySelector(".dummyEditorTitle");
    dummy.innerHTML = textarea.value;
    setHeight(dummy.scrollHeight > 60 ? dummy.scrollHeight : 60);
  }, []);

  useEffect(() => {
    if (!window.ResizeObserver) return;
    const myObserver = new ResizeObserver((entries) => {
      const newHeight = entries[0].contentRect.height;
      setHeight(newHeight > 60 ? newHeight : 60);
    });
    myObserver.observe(document.querySelector(".dummyEditorTitle"));
  }, []);

  useEffect(() => {
    console.log("title changged", title);
    if (!inputRef.current) return;
    clearTimeout(changeTimeout);
    inputRef.current.value = title;
    resize();
  }, [title, resize]);

  useEffect(() => {
    if (shouldFocus) inputRef.current.focus();
  }, [shouldFocus]);

  return (
    <Flex width="100%" sx={{ position: "relative" }} py={2}>
      <Text
        as="pre"
        className="dummyEditorTitle"
        variant="heading"
        fontSize="2.625em"
        sx={{ whiteSpace: "pre-wrap", position: "absolute", zIndex: -1 }}
      ></Text>
      <Input
        ref={inputRef}
        className="editorTitle"
        autoFocus={shouldFocus}
        placeholder="Untitled"
        as="textarea"
        width="100%"
        p={0}
        sx={{
          height,
          overflowY: "hidden",
          fontFamily: "heading",
          fontSize: "2.625em",
          fontWeight: "heading",
          border: "none",
          resize: "none",
          ":focus": { outline: "none" },
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        onChange={(e) => {
          resize();
          clearTimeout(changeTimeout);
          changeTimeout = setTimeout(
            setTitle.bind(this, e.target.value),
            changeInterval
          );
        }}
      />
    </Flex>
    // <TextArea
    //   ref={inputRef}
    //   autoFocus={shouldFocus}
    //   className="editorTitle"
    //   data-test-id="editor-title"
    //   placeholder="Untitled"
    //   maxLength={240}
    //   style={{
    //     backgroundColor: "transparent",
    //     fontFamily: theme.fonts["heading"],
    //     fontSize: "2.625em",
    //     fontWeight: theme.fontWeights["heading"],
    //     resize: "none",
    //     paddingRight: theme.space[2],
    //     paddingLeft: theme.space[2],
    //     border: "none",
    //     color: theme.colors["text"],
    //     width: "100%",
    //   }}

    // />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return (
    prevProps.shouldFocus === nextProps.shouldFocus &&
    prevProps.title === nextProps.title
  );
});
