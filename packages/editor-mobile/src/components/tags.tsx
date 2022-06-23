import { useRef, useState } from "react";
import { EditorController } from "../hooks/useEditorController";
import { EventTypes } from "../utils";
import styles from "./styles.module.css";

export default function Tags({ controller }: { controller: EditorController }) {
  const [tags, setTags] = useState<{ title: string; alias: string }[]>([]);
  const editorTags = useRef({
    setTags: setTags,
  });

  global.editorTags = editorTags;

  const openManageTagsSheet = () => {
    if (editor?.isFocused) {
      editor.commands.blur();
      editorTitle.current?.blur();
    }
    post(EventTypes.newtag);
  };

  return (
    <div
      style={{
        padding: "0px 12px",
        display: "flex",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      <button
        className={styles.btn}
        onMouseUp={(e) => {
          e.preventDefault();
          openManageTagsSheet();
        }}
        onMouseDown={(e) => e.preventDefault()}
        onTouchEnd={(e) => {
          e.preventDefault();
          openManageTagsSheet();
        }}
        style={{
          borderWidth: 0,
          backgroundColor: "var(--nn_nav)",
          marginRight: 5,
          borderRadius: 100,
          padding: "0px 10px",
          fontFamily: "Open Sans",
          display: "flex",
          alignItems: "center",
          height: "30px",
        }}
      >
        {tags.length === 0 ? (
          <p
            style={{
              marginRight: 4,
              fontSize: 13,
              color: "var(--nn_icon)",
              userSelect: "none",
            }}
          >
            Add a tag
          </p>
        ) : null}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          width="20"
          height="20"
          viewBox="0 0 24 24"
        >
          <path
            fill="var(--nn_accent)"
            d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"
          />
        </svg>
      </button>

      {tags.map((tag) => (
        <button
          className={styles.btn}
          style={{
            borderWidth: 0,
            backgroundColor: "var(--nn_nav)",
            marginRight: 5,
            borderRadius: 100,
            padding: "0px 10px",
            height: "30px",
            fontFamily: "Open Sans",
            fontSize: 13,
            color: "var(--nn_icon)",
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            post(EventTypes.tag, tag.title);
          }}
          onMouseDown={(e) => e.preventDefault()}
          onTouchEnd={(e) => {
            e.preventDefault();
            post(EventTypes.tag, tag.title);
          }}
        >
          #{tag.alias}
        </button>
      ))}
    </div>
  );
}
