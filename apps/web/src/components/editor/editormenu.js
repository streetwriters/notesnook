import React from "react";
import { useStore } from "../../stores/editor-store";
import { Flex, Button } from "rebass";
import { showExportDialog } from "../../common/dialog-controller";

function EditorMenu(props) {
  const saveSession = useStore((store) => store.saveSession);
  const newSession = useStore((store) => store.newSession);
  const sessionId = useStore((store) => store.session.id);
  const { quill } = props;

  return (
    <Flex
      sx={{
        height: [0, "auto", "auto"],
        visibility: ["collapse", "visible", "visible"],
        borderBottom: "1px solid",
        borderColor: "border",
        fontSize: 13,
      }}
    >
      <Button variant="menu" onClick={() => newSession()}>
        <span style={{ textDecoration: "underline" }}>N</span>ew
      </Button>
      <Button variant="menu" onClick={() => quill?.history?.undo()}>
        Undo
      </Button>
      <Button variant="menu" onClick={() => quill?.history?.redo()}>
        Redo
      </Button>
      <Button variant="menu" onClick={() => saveSession()}>
        <span style={{ textDecoration: "underline" }}>S</span>ave
      </Button>
      <Button
        variant="menu"
        onClick={() => sessionId && showExportDialog(sessionId)}
      >
        <span style={{ textDecoration: "underline" }}>E</span>xport
      </Button>
    </Flex>
  );
}
export default EditorMenu;
