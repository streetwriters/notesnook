import React, { useEffect, useMemo, useState } from "react";
import tinymce from "tinymce/tinymce";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useStore, store } from "../../stores/editor-store";
import { showToast } from "../../utils/toast";
import Animated from "../animated";

function Toolbar(props) {
  const sessionState = useStore((store) => store.session.state);
  const [undoable, setUndoable] = useState(false);
  const [redoable, setRedoable] = useState(false);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const toggleFocusMode = useAppStore((store) => store.toggleFocusMode);
  const setSession = useStore((store) => store.setSession);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const clearSession = useStore((store) => store.clearSession);
  const title = useStore((store) => store.session.title);
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
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
    function updateState() {
      if (!tinymce.activeEditor) return;
      setUndoable(tinymce.activeEditor.undoManager.hasUndo());
      setRedoable(tinymce.activeEditor.undoManager.hasRedo());
    }
    tinymce.EditorManager.once("AddEditor", () => {
      tinymce.activeEditor.on("Undo", updateState);
      tinymce.activeEditor.on("BeforeAddUndo", updateState);
      tinymce.activeEditor.on("AddUndo", updateState);
      tinymce.activeEditor.on("Redo", updateState);
      tinymce.activeEditor.on("ClearUndos", updateState);
      tinymce.activeEditor.on("TypingUndo", updateState);

      tinymce.activeEditor.on("remove", () => {
        tinymce.activeEditor.off("Undo", updateState);
        tinymce.activeEditor.off("BeforeAddUndo", updateState);
        tinymce.activeEditor.off("AddUndo", updateState);
        tinymce.activeEditor.off("Redo", updateState);
        tinymce.activeEditor.off("ClearUndos", updateState);
        tinymce.activeEditor.off("TypingUndo", updateState);
      });
    });
  }, [sessionState]);

  const tools = useMemo(
    () => [
      {
        title: theme === "Dark" ? "Light mode" : "Dark mode",
        icon: Icon.Theme,
        hidden: !isFocusMode,
        onClick: () => toggleNightMode(),
      },
      {
        title: "Undo",
        icon: Icon.Undo,
        enabled: undoable,
        onClick: () => tinymce.activeEditor.execCommand("Undo"),
      },
      {
        title: "Redo",
        icon: Icon.Redo,
        enabled: redoable,
        onClick: () => tinymce.activeEditor.execCommand("Redo"),
      },
      {
        title: isFocusMode ? "Normal mode" : "Focus mode",
        icon: isFocusMode ? Icon.NormalMode : Icon.FocusMode,
        enabled: true,
        hideOnMobile: true,
        onClick: () => {
          toggleFocusMode();
          if (tinymce.activeEditor) tinymce.activeEditor.focus();
        },
      },
      {
        title: "Properties",
        icon: Icon.Properties,
        enabled: true,
        onClick: toggleProperties,
      },
    ],
    [
      redoable,
      undoable,
      toggleFocusMode,
      toggleProperties,
      isFocusMode,
      theme,
      toggleNightMode,
    ]
  );

  return (
    <Flex m={2} justifyContent={"space-between"}>
      <Flex justifyContent="center" alignItems="center" flex={1}>
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
        <Animated.Input
          ml={[2, 2, 0]}
          initial={{ opacity: isTitleVisible ? 1 : 0 }}
          animate={{ opacity: isTitleVisible ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          fontWeight="heading"
          fontSize="heading"
          defaultValue={title}
          color="text"
          onChange={(e) => {
            const title = e.target.value;
            setSession((state) => {
              state.session.title = title;
            });
          }}
          sx={{
            p: 0,
            borderWidth: 0,
            borderRadius: 0,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
            ":focus": { borderWidth: 0 },
          }}
        />
      </Flex>
      <Flex justifyContent="flex-end">
        {tools.map((tool) => (
          <Button
            data-test-id={tool.title.toLowerCase().replace(/ /g, "-")}
            disabled={!tool.enabled}
            variant="tool"
            ml={2}
            title={tool.title}
            key={tool.title}
            sx={{
              display: [
                tool.hideOnMobile ? "none" : "block",
                tool.hidden ? "none" : "block",
              ],
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
