import React, { useEffect, useState } from "react";
import { Input } from "@rebass/forms";

type TitleBoxProps = {
  readonly: boolean;
  title: string;
  setTitle: (title: string) => void;
};

function TitleBox(props: TitleBoxProps) {
  const { readonly, setTitle, title } = props;
  const [currentTitle, setCurrentTitle] = useState<string>();

  useEffect(() => {
    // if (currentTitle !== title) setPlaceholder(title);
    // We do not want to update when currentTitle changes.
    setCurrentTitle(title);
  }, [title]);

  return (
    <Input
      value={currentTitle}
      variant="clean"
      data-test-id="editor-title"
      className="editorTitle"
      placeholder={"Note title"}
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
        setTitle(e.target.value);
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return (
    prevProps.readonly === nextProps.readonly &&
    prevProps.title === nextProps.title &&
    prevProps.setTitle === nextProps.setTitle
  );
});
