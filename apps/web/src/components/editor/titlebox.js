import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, Flex } from "rebass";
import { Input } from "@rebass/forms";

function TitleBox(props) {
  const { title, setTitle, shouldFocus, readonly } = props;

  const [height, setHeight] = useState(0);
  const inputRef = useRef();

  const resize = useCallback(() => {
    const textarea = document.querySelector(".editorTitle");
    const dummy = document.querySelector(".dummyEditorTitle");
    dummy.innerHTML = textarea.value;
    setHeight(dummy.scrollHeight);
  }, []);

  useEffect(() => {
    if (!window.ResizeObserver) return;
    const myObserver = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        const newHeight = entries[0].contentRect.height;
        setHeight(newHeight);
      });
    });
    myObserver.observe(document.querySelector(".dummyEditorTitle"));
    return () => {
      myObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!inputRef.current) return;
    console.log("TITLE!", title);
    inputRef.current.value = title;
    resize();
  }, [title, resize]);

  useEffect(() => {
    if (shouldFocus) inputRef.current.focus();
  }, [shouldFocus]);

  return (
    <Flex width="100%" sx={{ position: "relative" }} flexShrink={0}>
      <Text
        className="dummyEditorTitle"
        variant="heading"
        minHeight={[30, 30, 60]}
        fontSize={["1.625em", "1.625em", "2.625em"]}
        sx={{ whiteSpace: "pre-wrap", position: "absolute", zIndex: -1 }}
      ></Text>
      <Input
        ref={inputRef}
        variant="clean"
        data-test-id="editor-title"
        className="editorTitle"
        autoFocus={shouldFocus}
        placeholder="Note title"
        as="textarea"
        width="100%"
        minHeight={[30, 30, 60]}
        readOnly={readonly}
        p={0}
        sx={{
          height,
          overflowY: "hidden",
          fontFamily: "heading",
          fontSize: ["1.625em", "1.625em", "2.625em"],
          fontWeight: "heading",
          border: "none",
          resize: "none",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        onChange={(e) => {
          resize();
          setTitle(e.target.value);
        }}
      />
    </Flex>
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  console.log("React.memo", prevProps.title === nextProps.title);
  return (
    prevProps.shouldFocus === nextProps.shouldFocus &&
    prevProps.title === nextProps.title &&
    prevProps.readonly === nextProps.readonly
  );
});
