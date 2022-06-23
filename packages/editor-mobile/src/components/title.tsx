import { useEffect, useRef } from "react";
import { EditorController } from "../hooks/useEditorController";
import styles from "./styles.module.css";
export default function Title({
  controller,
}: {
  controller: EditorController;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const emitUpdate = useRef(true);
  global.editorTitle = titleRef;

  useEffect(() => {
    if (titleRef.current) {
      emitUpdate.current = false;
      titleRef.current.value = controller.title;
      emitUpdate.current = true;
    }
  }, [controller.title]);

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
        controller.titleChange(event.target.value);
      }}
      placeholder="Note title"
    />
  );
}
