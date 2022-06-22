import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, Flex } from "rebass";
import { Input } from "@rebass/forms";

function TitleBox(props) {
  const { title, setTitle, shouldFocus, readonly, placeholder } = props;

  const inputRef = useRef();

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = title;
  }, [title]);

  useEffect(() => {
    if (shouldFocus) inputRef.current.focus();
  }, [shouldFocus]);

  return (
    <Input
      ref={inputRef}
      variant="clean"
      data-test-id="editor-title"
      className="editorTitle"
      autoFocus={shouldFocus}
      placeholder={placeholder}
      width="100%"
      readOnly={readonly}
      p={0}
      sx={{
        overflowY: "hidden",
        fontFamily: "heading",
        fontSize: ["1.625em", "1.625em", "2.625em"],
        fontWeight: "heading",
      }}
      onChange={(e) => {
        setTitle(e.target.value);
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return (
    prevProps.shouldFocus === nextProps.shouldFocus &&
    prevProps.title === nextProps.title &&
    prevProps.readonly === nextProps.readonly &&
    prevProps.placeholder === nextProps.placeholder
  );
});
