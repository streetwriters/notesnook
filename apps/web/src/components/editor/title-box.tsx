import React, { useEffect, useState } from "react";
import { Input } from "@rebass/forms";

type TitleBoxProps = {
  nonce?: number;
  readonly: boolean;
  title: string;
  setTitle: (title: string) => void;
};

function TitleBox(props: TitleBoxProps) {
  const { readonly, setTitle, title, nonce } = props;
  const [currentTitle, setCurrentTitle] = useState<string>("");

  useEffect(() => {
    setCurrentTitle(title);
  }, [nonce]);

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
    prevProps.nonce === nextProps.nonce
  );
});
