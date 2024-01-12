/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Button, Flex, Text } from "@theme-ui/components";
import { useState } from "react";
import {
  Cross,
  ExitFullscreen,
  FocusMode,
  Fullscreen,
  Lock,
  NormalMode,
  Note,
  Pin,
  Properties,
  Search,
  TableOfContents,
  Unlock
} from "../icons";
import { ScrollContainer } from "@notesnook/ui";
import {
  SessionType,
  isLockedSession,
  useEditorStore
} from "../../stores/editor-store";
import { Menu } from "../../hooks/use-menu";
import { useStore as useAppStore } from "../../stores/app-store";
import { useEditorManager, useSearch } from "./manager";

export function EditorActionBar() {
  // const editorMargins = useEditorStore((store) => store.editorMargins);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeSession = useEditorStore((store) =>
    store.activeSessionId ? store.getSession(store.activeSessionId) : undefined
  );
  const { toggleSearch } = useSearch();

  const tools = [
    // {
    //   title: editorMargins ? "Disable editor margins" : "Enable editor margins",
    //   icon: editorMargins ? EditorNormalWidth : EditorFullWidth,
    //   enabled: true,
    //   onClick: () => useEditorStore.getState().toggleEditorMargins()
    // },
    {
      title: isFocusMode ? "Normal mode" : "Focus mode",
      icon: isFocusMode ? FocusMode : NormalMode,
      enabled: true,
      hideOnMobile: true,
      onClick: () => {
        useAppStore.getState().toggleFocusMode();
        if (document.fullscreenElement) exitFullscreen();
        const id = useEditorStore.getState().activeSessionId;
        const editor = id && useEditorManager.getState().getEditor(id);
        if (editor) editor.editor?.focus();
      }
    },
    {
      title: isFullscreen ? "Exit fullscreen" : "Enter fullscreen",
      icon: isFullscreen ? ExitFullscreen : Fullscreen,
      enabled: true,
      hidden: !isFocusMode,
      hideOnMobile: true,
      onClick: () => {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen(document.documentElement);
        }
        setIsFullscreen((s) => !s);
      }
    },
    {
      title: "Table of contents",
      icon: TableOfContents,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "locked",
      onClick: () => useEditorStore.getState().toggleTableOfContents()
    },
    {
      title: "Search",
      icon: Search,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "locked" &&
        activeSession.type !== "readonly",
      onClick: toggleSearch
    },
    {
      title: "Properties",
      icon: Properties,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "readonly" &&
        activeSession.type !== "locked" &&
        !isFocusMode,
      onClick: () => useEditorStore.getState().toggleProperties()
    }
  ];

  return (
    <Flex sx={{ mb: 2, gap: 2 }}>
      <TabStrip />
      <Flex
        bg="background"
        sx={{
          borderRadius: "default",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "flex-end",
          mr: 2
        }}
      >
        {tools.map((tool) => (
          <Button
            data-test-id={tool.title}
            disabled={!tool.enabled}
            variant="secondary"
            title={tool.title}
            key={tool.title}
            sx={{
              display: [
                tool.hideOnMobile ? "none" : "flex",
                tool.hidden ? "none" : "flex"
              ],
              borderRadius: 0,
              flexShrink: 0
            }}
            onClick={tool.onClick}
          >
            <tool.icon size={18} />
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}

function TabStrip() {
  const sessions = useEditorStore((store) => store.sessions);
  const activeSessionId = useEditorStore((store) => store.activeSessionId);

  return (
    <ScrollContainer
      className="tabsScroll"
      suppressScrollY
      style={{ flex: 1 }}
      trackStyle={() => ({
        backgroundColor: "transparent",
        pointerEvents: "none"
      })}
      thumbStyle={() => ({ height: 3 })}
      onWheel={(e) => {
        const scrollcontainer = document.querySelector(".tabsScroll");
        if (!scrollcontainer) return;
        if (e.deltaY > 0) scrollcontainer.scrollLeft += 100;
        else if (e.deltaY < 0) scrollcontainer.scrollLeft -= 100;
      }}
    >
      <Flex
        sx={{
          flex: 1,
          my: 1,
          ml: 1,
          gap: 1,
          height: 32
        }}
        onDoubleClick={async (e) => {
          e.stopPropagation();
          useEditorStore.getState().newSession();
        }}
      >
        {sessions.map((session, i) => (
          <Tab
            key={session.id}
            title={
              session.title ||
              ("note" in session ? session.note.title : "Untitled")
            }
            isTemporary={!!session.preview}
            isActive={session.id === activeSessionId}
            isPinned={!!session.pinned}
            isLocked={isLockedSession(session)}
            type={session.type}
            index={i}
            onKeepOpen={() =>
              useEditorStore
                .getState()
                .updateSession(
                  session.id,
                  [session.type],
                  (s) => (s.preview = true)
                )
            }
            onFocus={() => {
              if (session.id !== activeSessionId) {
                useEditorStore.getState().openSession(session.id);
              }
            }}
            onMove={(from, to) => {
              if (from === to) return;

              useEditorStore.setState((state) => {
                const direction =
                  to === 0 ? "start" : from > to ? "left" : "right";
                const [fromTab] = state.sessions.splice(from, 1);
                const newIndex =
                  direction === "start" || direction === "right" ? to : to - 1;

                // unpin the tab if it is moved.
                if (fromTab.pinned) fromTab.pinned = false;
                // if the tab where this tab is being dropped is pinned,
                // let's pin our tab too.
                if (state.sessions[to].pinned) fromTab.pinned = true;

                state.sessions.splice(newIndex, 0, fromTab);
              });
            }}
            onClose={() => useEditorStore.getState().closeSessions(session.id)}
            onCloseAll={() =>
              useEditorStore
                .getState()
                .closeSessions(
                  ...sessions.filter((s) => !s.pinned).map((s) => s.id)
                )
            }
            onCloseOthers={() =>
              useEditorStore
                .getState()
                .closeSessions(
                  ...sessions
                    .filter((s) => s.id !== session.id && !s.pinned)
                    .map((s) => s.id)
                )
            }
            onCloseToTheRight={() =>
              useEditorStore
                .getState()
                .closeSessions(
                  ...sessions
                    .filter((s, index) => index > i && !s.pinned)
                    .map((s) => s.id)
                )
            }
            onCloseToTheLeft={() =>
              useEditorStore
                .getState()
                .closeSessions(
                  ...sessions
                    .filter((s, index) => index < i && !s.pinned)
                    .map((s) => s.id)
                )
            }
            onPin={() => {
              useEditorStore.setState((state) => {
                let to = state.sessions.findLastIndex((a) => a.pinned);
                if (to === -1) to = 0;
                const [fromTab] = state.sessions.splice(i, 1);
                fromTab.pinned = !fromTab.pinned;
                // preview tabs can never be pinned.
                if (fromTab.pinned) fromTab.preview = false;
                state.sessions.splice(to + 1, 0, fromTab);
              });
            }}
          />
        ))}
      </Flex>
    </ScrollContainer>
  );
}

const dragState: { element?: HTMLElement | null; index: number } = {
  element: undefined,
  index: -1
};

type TabProps = {
  title: string;
  index: number;
  isActive: boolean;
  isTemporary: boolean;
  isPinned: boolean;
  isLocked: boolean;
  type: SessionType;
  onKeepOpen: () => void;
  onFocus: () => void;
  onClose: () => void;
  onCloseOthers: () => void;
  onCloseToTheRight: () => void;
  onCloseToTheLeft: () => void;
  onCloseAll: () => void;
  onPin: () => void;
  onMove: (from: number, to: number) => void;
};
function Tab(props: TabProps) {
  const {
    title,
    index,
    isActive,
    isTemporary,
    isPinned,
    isLocked,
    type,
    onKeepOpen,
    onFocus,
    onClose,
    onCloseAll,
    onCloseOthers,
    onCloseToTheRight,
    onCloseToTheLeft,
    onMove,
    onPin
  } = props;
  const [isDragOver, setIsDragOver] = useState(false);
  const Icon = isLocked ? (type === "locked" ? Lock : Unlock) : Note;

  return (
    <Flex
      className="tab"
      sx={{
        borderRadius: "default",
        cursor: "pointer",
        px: 2,
        py: "7px",
        bg: isDragOver
          ? "shade"
          : isActive
          ? "background"
          : "background-secondary",
        // borderTopLeftRadius: "default",
        // borderTopRightRadius: "default",
        // borderBottom: isActive ? "none" : "1px solid var(--border)",
        border: "1px solid",
        borderColor: isActive ? "border" : "transparent",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        ":hover": {
          "& .closeTabButton": {
            visibility: "visible"
          },
          bg: isActive ? "background" : "hover"
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        Menu.openMenu([
          { type: "button", title: "Close", key: "close", onClick: onClose },
          {
            type: "button",
            title: "Close others",
            key: "close-others",
            onClick: onCloseOthers
          },
          {
            type: "button",
            title: "Close to the right",
            key: "close-to-the-right",
            onClick: onCloseToTheRight
          },
          {
            type: "button",
            title: "Close to the left",
            key: "close-to-the-left",
            onClick: onCloseToTheLeft
          },
          {
            type: "button",
            title: "Close all",
            key: "close-all",
            onClick: onCloseAll
          },
          { type: "separator", key: "sep" },
          {
            type: "button",
            key: "keep-open",
            title: "Keep open",
            onClick: onKeepOpen,
            isDisabled: !isTemporary
          },
          {
            type: "button",
            key: "pin",
            title: "Pin",
            onClick: onPin,
            isChecked: isPinned,
            icon: Pin.path
          }
        ]);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (isTemporary) onKeepOpen();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
      draggable
      onDragStart={(e) => {
        if (!(e.target instanceof HTMLElement)) return;
        onFocus();
        e.target.style.cursor = "grabbing";
        dragState.element = e.target;
        dragState.index = index;
      }}
      onDragEnd={(e) => {
        if (!(e.target instanceof HTMLElement)) return;
        e.target.style.cursor = "pointer";
        dragState.element = null;
        dragState.index = -1;
      }}
      onDragOver={(e) => {
        if (e.target === dragState.element) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragEnter={(e) => {
        if (e.target === dragState.element) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.target === dragState.element) return;
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        setIsDragOver(false);
        onMove(dragState.index, index);
      }}
    >
      <Flex mr={1}>
        <Icon size={16} color={isActive ? "accent" : "icon"} />
        <Text
          variant="body"
          sx={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflowX: "hidden",
            pointerEvents: "none",
            fontStyle: isTemporary ? "italic" : "normal",
            maxWidth: 120
          }}
          ml={1}
        >
          {title}
        </Text>
      </Flex>
      {isPinned ? (
        <Pin
          sx={{
            ":hover": { bg: "border" },
            borderRadius: "default",
            flexShrink: 0
          }}
          size={14}
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
        />
      ) : (
        <Cross
          sx={{
            visibility: isActive ? "visible" : "hidden",
            ":hover": { bg: "border" },
            borderRadius: "default",
            flexShrink: 0
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="closeTabButton"
          size={16}
        />
      )}
    </Flex>
  );
}

// import { useEffect, useMemo, useState } from "react";
// import { Button, Flex, Text } from "@theme-ui/components";
// import {
//   Published,
//   Publish,
//   EditorNormalWidth,
//   EditorFullWidth,
//   ThemeIcon,
//   FocusMode,
//   NormalMode,
//   ExitFullscreen,
//   Fullscreen,
//   Search,
//   Undo,
//   Redo,
//   Properties,
//   ArrowLeft
// } from "../icons";
// import { useStore as useThemeStore } from "../../stores/theme-store";
// import { useStore as useMonographStore } from "../../stores/monograph-store";
// import { useStore, store } from "../../stores/editor-store";
// import { showToast } from "../../utils/toast";
// import { AnimatedInput } from "../animated";
// import { showPublishView } from "../publish-view";
// import { db } from "../../common/db";
// import { useEditorInstance, useHistory, useSearch } from "./manager";
// import { AppEventManager, AppEvents } from "../../common/app-events";

// // TODO: this needs to be cleaned up!
// function Toolbar() {
//   const sessionId = useStore((store) => store.session.id);
//   const isDeleted = useStore((store) => store.session.isDeleted);
//   const isLocked = useStore((store) => store.session.locked);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const isFocusMode = useAppStore((store) => store.isFocusMode);
//   const toggleFocusMode = useAppStore((store) => store.toggleFocusMode);
//   const toggleProperties = useStore((store) => store.toggleProperties);
//   const toggleEditorMargins = useStore((store) => store.toggleEditorMargins);
//   const clearSession = useStore((store) => store.clearSession);
//   const title = useStore((store) => store.session.title);
//   const theme = useThemeStore((store) => store.colorScheme);
//   const toggleNightMode = useThemeStore((store) => store.toggleColorScheme);
//   const [isTitleVisible, setIsTitleVisible] = useState(false);

//   const monographs = useMonographStore((store) => store.monographs);
//   const { canRedo, canUndo, redo, undo } = useHistory();
//   const { toggleSearch } = useSearch();
//   const editor = useEditorInstance();

//   const isNotePublished = useMemo(
//     () => sessionId && db.monographs.isPublished(sessionId),
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     [sessionId, monographs]
//   );

//   useEffect(() => {
//     const editorScroll = document.querySelector(".editorScroll");
//     if (!editorScroll) return;

//     function onScroll(e) {
//       const hideOffset = document.querySelector(".editorTitle").scrollHeight;
//       if (e.target.scrollTop > hideOffset && !isTitleVisible)
//         setIsTitleVisible(e.target.scrollTop > hideOffset && !isTitleVisible);
//       else if (e.target.scrollTop <= hideOffset && isTitleVisible)
//         setIsTitleVisible(false);
//     }
//     editorScroll.addEventListener("scroll", onScroll);
//     return () => {
//       editorScroll.removeEventListener("scroll", onScroll);
//     };
//   }, [isTitleVisible]);

//   const tools = useMemo(
//     () => [
//       {
//         title: isNotePublished ? "Published" : "Publish",
//         icon: isNotePublished ? Published : Publish,
//         hidden: !sessionId || isDeleted,
//         enabled: !isLocked,
//         onClick: () => showPublishView(store.get().session.id, "top")
//       }
//     ],
//     [sessionId, isLocked, isNotePublished, isDeleted]
//   );

//   return (
// <Flex mx={2} my={1} sx={{ justifyContent: "space-between" }}>
//       <Flex sx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ArrowLeft
//           sx={{
//             display: ["block", "none", "none"],
//             flexShrink: 0
//           }}
//           size={24}
//           onClick={() => {
//             if (store.get().session.id) showToast("success", "Note saved!");
//             if (isFocusMode) toggleFocusMode();
//             clearSession();
//           }}
//         />
//         <AnimatedInput
//           variant="clean"
//           ml={[2, 2, 0]}
//           initial={{
//             opacity: isTitleVisible ? 1 : 0,
//             zIndex: isTitleVisible ? 1 : -1
//           }}
//           animate={{
//             opacity: isTitleVisible ? 1 : 0,
//             zIndex: isTitleVisible ? 1 : -1
//           }}
//           transition={{ duration: 0.5 }}
//           defaultValue={title}
//           onChange={(e) => {
//             AppEventManager.publish(AppEvents.changeNoteTitle, {
//               title: e.target.value,
//               preventSave: false
//             });
//           }}
//           sx={{
//             flex: 1,
//             fontWeight: "heading",
//             fontSize: "heading",
//             color: "paragraph",
//             p: 0,
//             pl: 4,
//             borderWidth: 0,
//             borderRadius: "default",
//             textOverflow: "ellipsis",
//             whiteSpace: "nowrap",
//             overflow: "hidden"
//           }}
//         />
//       </Flex>

//       <Flex sx={{ gap: 1 }}>
//         {tools.map((tool) => (
//           <Button
//             key={tool.title}
//             variant="secondary"
//             data-test-id={tool.title}
//             disabled={!tool.enabled}
//             title={tool.title}
//             sx={{
//               display: [
//                 tool.hideOnMobile ? "none" : "flex",
//                 tool.hidden ? "none" : "flex"
//               ],
//               color: "paragraph",
//               flexDirection: "row",
//               flexShrink: 0,
//               alignItems: "center"
//             }}
//             onClick={tool.onClick}
//           >
//             <tool.icon size={18} />
//             <Text
//               variant="body"
//               ml={1}
//               sx={{ display: ["none", "none", "block"] }}
//             >
//               {tool.title}
//             </Text>
//           </Button>
//         ))}
//       </Flex>
//     </Flex>
//   );
// }
// export default Toolbar;

function enterFullscreen(elem: HTMLElement) {
  elem.requestFullscreen();
}

function exitFullscreen() {
  if (!document.fullscreenElement) return;
  document.exitFullscreen();
}
