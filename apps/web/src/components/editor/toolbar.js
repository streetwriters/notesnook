import React, { useEffect, useMemo, useState } from "react";
import tinymce from "tinymce/tinymce";
import { Button, Flex, Text } from "rebass";
import * as Icon from "../icons";
import { useStore as useAppStore } from "../../stores/app-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useStore, store } from "../../stores/editor-store";
import { showToast } from "../../utils/toast";
import Animated from "../animated";
import { showPublishView } from "../publish-view";
import { db } from "../../common/db";

function Toolbar(props) {
  const sessionState = useStore((store) => store.session.state);
  const sessionId = useStore((store) => store.session.id);
  const isLocked = useStore((store) => store.session.locked);
  const [undoable, setUndoable] = useState(false);
  const [redoable, setRedoable] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const toggleFocusMode = useAppStore((store) => store.toggleFocusMode);
  const setSession = useStore((store) => store.setSession);
  const toggleProperties = useStore((store) => store.toggleProperties);
  const clearSession = useStore((store) => store.clearSession);
  const title = useStore((store) => store.session.title);
  const theme = useThemeStore((store) => store.theme);
  const toggleNightMode = useThemeStore((store) => store.toggleNightMode);
  const [isTitleVisible, setIsTitleVisible] = useState(false);

  const isNotePublished = useMemo(
    () => sessionId && db.monographs.isPublished(sessionId),
    [sessionId]
  );

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
        enabled: true,
        onClick: () => toggleNightMode(),
      },
      {
        title: isFullscreen ? "Exit fullscreen" : "Enter fullscreen",
        icon: isFullscreen ? Icon.ExitFullscreen : Icon.Fullscreen,
        enabled: true,
        hidden: !isFocusMode,
        hideOnMobile: true,
        onClick: () => {
          if (isFullscreen) {
            exitFullscreen(document);
          } else {
            enterFullscreen(document.documentElement);
          }
          setIsFullscreen((s) => !s);
        },
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
        title: isNotePublished ? "Published" : "Publish",
        icon: isNotePublished ? Icon.Published : Icon.Publish,
        enabled: !isLocked,
        onClick: () => showPublishView(store.get().session.id, "top"),
      },
      {
        title: "Properties",
        icon: Icon.Properties,
        enabled: true,
        hidden: isFocusMode,
        onClick: toggleProperties,
      },
    ],
    [
      isFullscreen,
      redoable,
      undoable,
      toggleFocusMode,
      toggleProperties,
      isFocusMode,
      isLocked,
      theme,
      toggleNightMode,
      isNotePublished,
    ]
  );

  return (
    <Flex m={2} justifyContent={"space-between"}>
      <Flex justifyContent="center" alignItems="center" flex={1}>
        <Icon.ArrowLeft
          sx={{
            display: ["block", "none", "none"],
            flexShrink: 0,
          }}
          size={24}
          onClick={() => {
            if (store.get().session.id) showToast("success", "Note saved!");
            if (isFocusMode) toggleFocusMode();
            clearSession();
          }}
        />
        <Animated.Input
          ml={[2, 2, 0]}
          initial={{
            opacity: isTitleVisible ? 1 : 0,
            zIndex: isTitleVisible ? 1 : -1,
          }}
          animate={{
            opacity: isTitleVisible ? 1 : 0,
            zIndex: isTitleVisible ? 1 : -1,
          }}
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
      <Flex alignItems="center" justifyContent="flex-end">
        {tools.map((tool) => (
          <Button
            data-test-id={tool.title.toLowerCase().replace(/ /g, "-")}
            disabled={!tool.enabled}
            variant="tool"
            flexShrink={0}
            ml={2}
            title={tool.title}
            key={tool.title}
            sx={{
              display: [
                tool.hideOnMobile ? "none" : "flex",
                tool.hidden ? "none" : "flex",
              ],
              color: tool.enabled ? "text" : "disabled",
              cursor: tool.enabled ? "pointer" : "not-allowed",
            }}
            onClick={tool.onClick}
            flexDirection="row"
            alignItems="center"
          >
            <tool.icon size={18} color={tool.enabled ? "text" : "disabled"} />
            <Text display={["none", "none", "block"]} variant="body" ml={1}>
              {tool.title}
            </Text>
            {tool.new && (
              <Text
                variant="subBody"
                fontSize={10}
                ml={1}
                bg="primary"
                color="static"
                px={"3px"}
                py="1px"
                sx={{ borderRadius: "default" }}
              >
                NEW
              </Text>
            )}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
export default Toolbar;

/* View in fullscreen */
function enterFullscreen(elem) {
  // go full-screen
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}

/* Close fullscreen */
function exitFullscreen(elem) {
  if (
    !document.fullscreenElement &&
    !document.webkitFullscreenElement &&
    !document.mozFullScreenElement
  )
    return;

  // exit full-screen
  if (elem.exitFullscreen) {
    elem.exitFullscreen();
  } else if (elem.webkitExitFullscreen) {
    elem.webkitExitFullscreen();
  } else if (elem.mozCancelFullScreen) {
    elem.mozCancelFullScreen();
  } else if (elem.msExitFullscreen) {
    elem.msExitFullscreen();
  }
}
