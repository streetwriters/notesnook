import React, { useEffect, useMemo, useState } from "react";
import "./editor.css";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore } from "../../stores/editor-store";
import { showToast } from "../../utils/toast";
import { EventManagers } from "../../utils/observablearray";

function Toolbar(props) {
  const { quill } = props;
  const sessionState = useStore((store) => store.session.state);
  const [undoable, setUndoable] = useState(false);
  const [redoable, setRedoable] = useState(false);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const toggleFocusMode = useAppStore((store) => store.toggleFocusMode);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const clearSession = useStore((store) => store.clearSession);

  useEffect(() => {
    if (!quill?.history) return;

    function updateState() {
      setUndoable(quill.history.stack.undo.length > 0);
      setRedoable(quill.history.stack.redo.length > 0);
    }

    EventManagers.redo.subscribeMulti(["pop", "push"], updateState);
    EventManagers.undo.subscribeMulti(["pop", "push"], updateState);

    return () => {
      EventManagers.undo.unsubscribeAll();
      EventManagers.redo.unsubscribeAll();
    };
  }, [sessionState, quill]);

  const tools = useMemo(
    () => [
      {
        title: "Undo",
        icon: Icon.Undo,
        enabled: undoable,
        onClick: () => quill.history.undo(),
      },
      {
        title: "Redo",
        icon: Icon.Redo,
        enabled: redoable,
        onClick: () => quill.history.redo(),
      },
      {
        title: isFocusMode ? "Normal mode" : "Focus mode",
        icon: Icon.FocusMode,
        enabled: true,
        onClick: toggleFocusMode,
      },
      {
        title: "Properties",
        icon: Icon.Properties,
        enabled: true,
        onClick: toggleProperties,
      },
    ],
    [quill, redoable, undoable, toggleFocusMode, toggleProperties, isFocusMode]
  );

  return (
    <Flex m={2} justifyContent={["space-between", "space-between", "flex-end"]}>
      <Icon.ChevronLeft
        sx={{
          display: ["block", "block", "none"],
        }}
        size={30}
        onClick={() => {
          clearSession();
          showToast("success", "Note saved!");
        }}
      />
      <Flex justifyContent="flex-end">
        {tools.map((tool) => (
          <Button
            disabled={!tool.enabled}
            variant="tool"
            title={tool.title}
            key={tool.title}
            sx={{
              color: tool.enabled ? "text" : "disabled",
              cursor: tool.enabled ? "pointer" : "not-allowed",
            }}
            onClick={tool.onClick}
          >
            <Flex justifyContent="center" alignItems="center">
              <tool.icon size={18} color={tool.enabled ? "text" : "disabled"} />
              <Text display={["none", "none", "block"]} fontSize="body" ml={1}>
                {tool.title}
              </Text>
            </Flex>
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
export default Toolbar;
