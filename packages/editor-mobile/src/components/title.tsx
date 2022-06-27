import React from "react";
import { RefObject, useEffect, useRef } from "react";
import { EditorController } from "../hooks/useEditorController";
import styles from "./styles.module.css";
function Title({
  controller,
  title,
}: {
  controller: RefObject<EditorController>;
  title: string;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const emitUpdate = useRef(true);
  global.editorTitle = titleRef;

  useEffect(() => {
    if (titleRef.current) {
      emitUpdate.current = false;
      titleRef.current.value = title;
      emitUpdate.current = true;
    }
  }, [title]);

  return (
    <input
      ref={titleRef}
      className={styles.titleBar}
      style={{
        height: 50,
        fontSize: 27,
        width: "100%",
        boxSizing: "border-box",
        borderWidth: 0,
        paddingRight: 12,
        paddingLeft: 12,
        fontWeight: 600,
        fontFamily: "Open Sans",
        backgroundColor: "transparent",
        color: "var(--nn_heading)",
      }}
      onChange={(event) => {
        if (!emitUpdate.current) return;
        controller.current?.titleChange(event.target.value);
      }}
      placeholder="Note title"
    />
  );
}

export default React.memo(Title, (prev, next) => {
  if (prev.title !== next.title) return false;
  return true;
});
