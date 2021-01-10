import React, { useEffect, useMemo, useState } from "react";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore, store } from "../../stores/editor-store";
import { showToast } from "../../utils/toast";
import { EventManagers } from "../../utils/observablearray";
import Animated from "../animated";

function Toolbar(props) {
  const { quill } = props;
  const sessionState = useStore((store) => store.session.state);
  const [undoable, setUndoable] = useState(false);
  const [redoable, setRedoable] = useState(false);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const toggleFocusMode = useAppStore((store) => store.toggleFocusMode);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const clearSession = useStore((store) => store.clearSession);
  const title = useStore((store) => store.session.title);
  const [isTitleVisible, setIsTitleVisible] = useState(false);

  useEffect(() => {
    const editorScroll = document.querySelector(".editorScroll");

    function onScroll(e) {
      const headerOffset = document.querySelector(".editorTitle").scrollHeight;
      const hideOffset = headerOffset + 60;
      if (e.target.scrollTop > hideOffset && !isTitleVisible)
        setIsTitleVisible(true);
      else if (e.target.scrollTop <= hideOffset && isTitleVisible)
        setIsTitleVisible(false);
    }
    editorScroll.addEventListener("scroll", onScroll);
    return () => {
      editorScroll.removeEventListener("scroll", onScroll);
    };
  }, [isTitleVisible]);

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
        icon: isFocusMode ? Icon.NormalMode : Icon.FocusMode,
        enabled: true,
        hideOnMobile: true,
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
    <Flex m={2} justifyContent={"space-between"}>
      <Flex justifyContent="center" alignItems="center">
        <Icon.ArrowLeft
          sx={{
            display: ["block", "block", "none"],
          }}
          size={18}
          onClick={() => {
            if (store.get().session.id) showToast("success", "Note saved!");
            if (isFocusMode) toggleFocusMode();
            clearSession();
          }}
        />
        <Animated.Text
          ml={[2, 2, 0]}
          initial={{ opacity: isTitleVisible ? 1 : 0 }}
          animate={{ opacity: isTitleVisible ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          fontWeight="heading"
        >
          {title}
        </Animated.Text>
      </Flex>
      <Flex justifyContent="flex-end">
        {tools.map((tool) => (
          <Button
            data-test-id={tool.title.toLowerCase().replace(/ /g, "-")}
            disabled={!tool.enabled}
            variant="tool"
            title={tool.title}
            key={tool.title}
            sx={{
              display: [tool.hideOnMobile ? "none" : "block", "block", "block"],
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
