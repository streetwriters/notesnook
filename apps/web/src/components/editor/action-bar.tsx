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
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Cross,
  Icon,
  Lock,
  NewTab,
  Note,
  NoteAdd,
  NoteRemove,
  Pin,
  Plus,
  Properties,
  Publish,
  Published,
  Readonly,
  Redo,
  Search,
  TableOfContents,
  Trash,
  Undo,
  Unlock
} from "../icons";
import { ScrollContainer } from "@notesnook/ui";
import {
  SaveState,
  SessionType,
  isLockedSession,
  useEditorStore
} from "../../stores/editor-store";
import { Menu } from "../../hooks/use-menu";
import { useStore as useAppStore } from "../../stores/app-store";
import { useEditorManager } from "./manager";
import {
  closestCenter,
  DndContext,
  useSensor,
  useSensors,
  KeyboardSensor,
  DragOverlay,
  MeasuringStrategy,
  MouseSensor
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { useWindowControls } from "../../hooks/use-window-controls";
import { useStore as useMonographStore } from "../../stores/monograph-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { db } from "../../common/db";
import { showPublishView } from "../publish-view";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import useMobile from "../../hooks/use-mobile";
import { strings } from "@notesnook/intl";
import { getWindowControls } from "../title-bar";
import useTablet from "../../hooks/use-tablet";
import { isMac } from "../../utils/platform";
import { CREATE_BUTTON_MAP } from "../../common";
import { getDragData } from "../../utils/data-transfer";

type ToolButton = {
  title: string;
  icon: Icon;
  enabled?: boolean;
  hidden?: boolean;
  hideOnMobile?: boolean;
  toggled?: boolean;
  onClick: () => void;
};

export function EditorActionBar() {
  const { isMaximized, isFullscreen, hasNativeWindowControls } =
    useWindowControls();
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const activeTab = useEditorStore((store) => store.getActiveTab());
  const activeSession = useEditorStore((store) =>
    activeTab ? store.getSession(activeTab.sessionId) : undefined
  );
  const editorManager = useEditorManager((store) =>
    activeSession?.id ? store.editors[activeSession?.id] : undefined
  );
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const arePropertiesVisible = useEditorStore(
    (store) => store.arePropertiesVisible
  );
  const isTOCVisible = useEditorStore((store) => store.isTOCVisible);
  const monographs = useMonographStore((store) => store.monographs);
  const isNotePublished =
    activeSession &&
    "note" in activeSession &&
    db.monographs.isPublished(activeSession.note.id);
  const isMobile = useMobile();
  const isTablet = useTablet();

  const tools: ToolButton[] = [
    {
      title: strings.newTab(),
      icon: NewTab,
      enabled: true,
      onClick: () => useEditorStore.getState().addTab()
    },
    {
      title: strings.undo(),
      icon: Undo,
      enabled: editorManager?.canUndo,
      onClick: () => editorManager?.editor?.undo(),
      hidden: activeSession?.type === "readonly"
    },
    {
      title: strings.redo(),
      icon: Redo,
      enabled: editorManager?.canRedo,
      onClick: () => editorManager?.editor?.redo(),
      hidden: activeSession?.type === "readonly"
    },
    {
      title: isNotePublished ? strings.published() : strings.publish(),
      icon: isNotePublished ? Published : Publish,
      hidden: !isLoggedIn,
      hideOnMobile: true,
      enabled:
        activeSession &&
        (activeSession.type === "default" || activeSession.type === "readonly"),
      onClick: () =>
        activeSession &&
        (activeSession.type === "default" ||
          activeSession.type === "readonly") &&
        showPublishView(activeSession.note, "top")
    },
    {
      title: strings.toc(),
      icon: TableOfContents,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "locked" &&
        activeSession.type !== "diff" &&
        activeSession.type !== "conflicted",
      onClick: () => useEditorStore.getState().toggleTableOfContents(),
      toggled: isTOCVisible
    },
    {
      title: strings.search(),
      icon: Search,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "locked" &&
        activeSession.type !== "diff" &&
        activeSession.type !== "conflicted",
      onClick: () => editorManager?.editor?.startSearch()
    },
    {
      title: strings.properties(),
      icon: Properties,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "locked" &&
        activeSession.type !== "conflicted" &&
        !isFocusMode,
      onClick: () => useEditorStore.getState().toggleProperties(),
      toggled: arePropertiesVisible
    },
    ...getWindowControls(
      hasNativeWindowControls,
      isFullscreen,
      isMaximized,
      isTablet,
      isMobile
    )
  ];

  return (
    <>
      {isMobile ? (
        <Flex sx={{ flex: 1 }}>
          <Button
            variant={"secondary"}
            sx={{
              height: "100%",
              bg: "transparent",
              borderRadius: 0,
              flexShrink: 0
            }}
            onClick={() =>
              AppEventManager.publish(AppEvents.toggleEditor, false)
            }
          >
            <ArrowLeft size={18} />
          </Button>
        </Flex>
      ) : (
        <TabStrip />
      )}
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          mr:
            hasNativeWindowControls && !isMac() && !isMobile && !isTablet
              ? `calc(100vw - env(titlebar-area-width))`
              : 1,
          pl: 1,
          borderLeft: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0
        }}
      >
        {tools.map((tool) => (
          <Button
            data-test-id={tool.title}
            disabled={!tool.enabled}
            variant={tool.title === "Close" ? "error" : "secondary"}
            title={tool.title}
            key={tool.title}
            sx={{
              p: 1,
              alignItems: "center",
              bg: tool.toggled ? "background-selected" : "transparent",
              display: [
                "hideOnMobile" in tool && tool.hideOnMobile ? "none" : "flex",
                tool.hidden ? "none" : "flex"
              ],
              flexShrink: 0,
              "&:hover svg path": {
                fill:
                  tool.title === "Close"
                    ? "var(--accentForeground-error) !important"
                    : "var(--icon)"
              }
            }}
            onClick={tool.onClick}
          >
            <tool.icon size={16} />
          </Button>
        ))}
      </Flex>
    </>
  );
}

const TabStrip = React.memo(function TabStrip() {
  useEditorStore((store) => store.getActiveSession()); // otherwise the tab title won't update on opening a note
  const tabs = useEditorStore((store) => store.tabs);
  const currentTab = useEditorStore((store) => store.activeTabId);
  const canGoBack = useEditorStore((store) => store.canGoBack);
  const canGoForward = useEditorStore((store) => store.canGoForward);

  return (
    <Flex sx={{ flex: 1 }}>
      <Flex
        sx={{
          px: 1,
          borderRight: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          alignItems: "center",
          flexShrink: 0
        }}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="accent"
          {...CREATE_BUTTON_MAP.notes}
          data-test-id={`create-new-note`}
          sx={{
            p: 1,
            borderRadius: "100%",
            mr: "small"
          }}
        >
          <Plus size={16} color="accentForeground" />
        </Button>
        <Button
          disabled={!canGoBack}
          onClick={() => useEditorStore.getState().goBack()}
          variant="secondary"
          sx={{ p: 1, bg: "transparent" }}
          data-test-id="go-back"
        >
          <ArrowLeft size={16} />
        </Button>
        <Button
          disabled={!canGoForward}
          onClick={() => useEditorStore.getState().goForward()}
          variant="secondary"
          sx={{ p: 1, bg: "transparent" }}
          data-test-id="go-forward"
        >
          <ArrowRight size={16} />
        </Button>
      </Flex>
      <ScrollContainer
        className="tabsScroll"
        suppressScrollY
        style={{ flex: 1, height: "100%" }}
        trackStyle={() => ({
          backgroundColor: "transparent",
          "--ms-track-size": "6px"
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
            height: "100%"
          }}
          onDoubleClick={async (e) => {
            e.stopPropagation();
            useEditorStore.getState().addTab();
          }}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.stopPropagation();

            const noteId = getDragData(e.dataTransfer, "note")?.[0];
            if (!noteId) return;

            useEditorStore
              .getState()
              .openSession(noteId, { openInNewTab: true });
          }}
          data-test-id="tabs"
        >
          <ReorderableList
            items={tabs}
            moveItem={(from, to) => {
              if (from === to) return;
              const tabs = useEditorStore.getState().tabs.slice();
              const isToPinned = tabs[to].pinned;
              const [fromTab] = tabs.splice(from, 1);

              // if the tab where this tab is being dropped is pinned,
              // let's pin our tab too.
              if (isToPinned) {
                fromTab.pinned = true;
              }
              // unpin the tab if it is moved.
              else if (fromTab.pinned) fromTab.pinned = false;

              tabs.splice(to, 0, fromTab);
              useEditorStore.setState({ tabs });
            }}
            renderItem={({ item: tab, index: i }) => {
              const session = useEditorStore
                .getState()
                .getSession(tab.sessionId);
              if (!session) return null;

              const isUnsaved =
                session.type === "default" &&
                session.saveState === SaveState.NotSaved;

              return (
                <Tab
                  id={tab.id}
                  key={tab.sessionId}
                  title={
                    session.title ||
                    ("note" in session
                      ? session.note.title
                      : strings.untitled())
                  }
                  isUnsaved={isUnsaved}
                  isActive={tab.id === currentTab}
                  isPinned={!!tab.pinned}
                  isLocked={isLockedSession(session)}
                  type={session.type}
                  onFocus={() => {
                    if (tab.id !== currentTab) {
                      useEditorStore.getState().activateSession(tab.sessionId);
                    }
                  }}
                  onClose={() => useEditorStore.getState().closeTabs(tab.id)}
                  onCloseAll={() =>
                    useEditorStore
                      .getState()
                      .closeTabs(
                        ...tabs.filter((s) => !s.pinned).map((s) => s.id)
                      )
                  }
                  onCloseOthers={() =>
                    useEditorStore
                      .getState()
                      .closeTabs(
                        ...tabs
                          .filter((s) => s.id !== tab.id && !s.pinned)
                          .map((s) => s.id)
                      )
                  }
                  onCloseToTheRight={() =>
                    useEditorStore
                      .getState()
                      .closeTabs(
                        ...tabs
                          .filter((s, index) => index > i && !s.pinned)
                          .map((s) => s.id)
                      )
                  }
                  onCloseToTheLeft={() =>
                    useEditorStore
                      .getState()
                      .closeTabs(
                        ...tabs
                          .filter((s, index) => index < i && !s.pinned)
                          .map((s) => s.id)
                      )
                  }
                  onRevealInList={
                    "note" in session
                      ? () =>
                          AppEventManager.publish(
                            AppEvents.revealItemInList,
                            session.note.id,
                            true
                          )
                      : undefined
                  }
                  onPin={() => useEditorStore.getState().pinTab(tab.id)}
                />
              );
            }}
          />
          <div
            style={{ width: "100%", borderBottom: "1px solid var(--border)" }}
          />
        </Flex>
      </ScrollContainer>
    </Flex>
  );
});

type TabProps = {
  id: string;
  title: string;
  isActive: boolean;
  isPinned: boolean;
  isLocked: boolean;
  isUnsaved: boolean;
  type: SessionType;
  onFocus: () => void;
  onClose: () => void;
  onCloseOthers: () => void;
  onCloseToTheRight: () => void;
  onCloseToTheLeft: () => void;
  onCloseAll: () => void;
  onPin: () => void;
  onRevealInList?: () => void;
};
function Tab(props: TabProps) {
  const {
    id,
    title,
    isActive,
    isPinned,
    isLocked,
    isUnsaved,
    type,
    onFocus,
    onClose,
    onCloseAll,
    onCloseOthers,
    onCloseToTheRight,
    onCloseToTheLeft,
    onRevealInList,
    onPin
  } = props;
  const Icon = isLocked
    ? type === "locked"
      ? Lock
      : Unlock
    : type === "readonly"
    ? Readonly
    : type === "deleted"
    ? Trash
    : isUnsaved
    ? NoteRemove
    : Note;
  const { attributes, listeners, setNodeRef, transform, transition, active } =
    useSortable({ id });
  const activeTabRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (activeTabRef.current && isActive) {
      const tab = activeTabRef.current;
      tab.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
      });
    }
  }, [isActive]);

  return (
    <Flex
      ref={(el) => {
        setNodeRef(el);
        activeTabRef.current = el;
      }}
      className={`tab${isActive || active?.id === id ? " active" : ""}`}
      data-test-id={`tab-${id}`}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.stopPropagation();

        const noteId = getDragData(e.dataTransfer, "note")?.[0];
        if (!noteId) return;

        useEditorStore.getState().openSessionInTab(noteId, id);
      }}
      sx={{
        height: "100%",
        cursor: "pointer",
        pl: 2,
        borderRight: "1px solid var(--border)",
        borderBottom: isActive
          ? "1px solid transparent"
          : "1px solid var(--border)",
        ":last-of-type": { borderRight: 0 },

        transform: CSS.Transform.toString(transform),
        transition,
        visibility: active?.id === id ? "hidden" : "visible",

        bg: isActive ? "background" : "transparent",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        ":hover": {
          "& .closeTabButton": {
            opacity: 1
          },
          bg: isActive ? "background" : "hover"
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        Menu.openMenu([
          {
            type: "button",
            title: strings.close(),
            key: "close",
            onClick: onClose
          },
          {
            type: "button",
            title: strings.closeOthers(),
            key: "close-others",
            onClick: onCloseOthers
          },
          {
            type: "button",
            title: strings.closeToRight(),
            key: "close-to-the-right",
            onClick: onCloseToTheRight
          },
          {
            type: "button",
            title: strings.closeToLeft(),
            key: "close-to-the-left",
            onClick: onCloseToTheLeft
          },
          {
            type: "button",
            title: strings.closeAll(),
            key: "close-all",
            onClick: onCloseAll
          },
          { type: "separator", key: "sep" },
          {
            type: "button",
            title: strings.revealInList(),
            key: "reveal-in-list",
            onClick: onRevealInList,
            isHidden: !onRevealInList
          },
          { type: "separator", key: "sep2", isHidden: !onRevealInList },
          {
            type: "button",
            key: "pin",
            title: strings.pin(),
            onClick: onPin,
            isChecked: isPinned
          }
        ]);
      }}
      onAuxClick={(e) => {
        if (e.button == 1) onClose();
      }}
      onClick={() => onFocus()}
      {...listeners}
      {...attributes}
    >
      <Flex>
        <Icon
          data-test-id={`tab-icon${isUnsaved ? "-unsaved" : ""}`}
          size={14}
          color={
            isUnsaved
              ? "icon-error"
              : isActive
              ? "icon-selected"
              : "icon-secondary"
          }
        />
        <Text
          data-test-id="tab-title"
          variant="body"
          sx={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflowX: "hidden",
            pointerEvents: "none",
            maxWidth: 120,
            color: isActive ? "paragraph-selected" : "paragraph-secondary"
          }}
          ml={1}
        >
          {title}
        </Text>
      </Flex>
      {isPinned ? (
        <Pin
          sx={{
            borderRadius: "default",
            flexShrink: 0,
            ml: "small",
            mr: 1,
            "&:hover": {
              bg: "hover-secondary"
            }
          }}
          size={14}
          onClick={onPin}
        />
      ) : (
        <Cross
          sx={{
            borderRadius: "default",
            flexShrink: 0,
            opacity: isActive || active?.id === id ? 1 : 0,
            ml: "small",
            mr: 1,
            "&:hover": {
              bg: "hover-secondary"
            }
          }}
          onClick={onClose}
          className="closeTabButton"
          data-test-id={"tab-close-button"}
          size={14}
        />
      )}
    </Flex>
  );
}

type ReorderableListProps<T> = {
  items: T[];
  renderItem: (props: { item: T; index: number }) => JSX.Element | null;
  moveItem: (from: number, to: number) => void;
};

function ReorderableList<T extends { id: string }>(
  props: ReorderableListProps<T>
) {
  const { items, renderItem: Item, moveItem } = props;
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  const [activeItem, setActiveItem] = useState<T>();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      // onDragCancel={(event) => {}}
      onDragStart={(event) => {
        setActiveItem(items.find((i) => i.id === event.active.id));
      }}
      onDragEnd={(event) => {
        const { active, over } = event;

        const overId = over?.id as string;
        if (overId && active.id !== overId) {
          const transitionItems = items.slice();
          const newIndex = transitionItems.findIndex((i) => i.id === overId);
          const oldIndex = transitionItems.findIndex((i) => i.id === active.id);
          moveItem(oldIndex, newIndex);
        }
        setActiveItem(undefined);
      }}
      measuring={{
        droppable: { strategy: MeasuringStrategy.Always }
      }}
      modifiers={[restrictToHorizontalAxis]}
    >
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        {items.map((item, index) => (
          <Item key={item.id} item={item} index={index} />
        ))}

        <DragOverlay
          dropAnimation={{
            duration: 500,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)"
          }}
        >
          {activeItem && <Item item={activeItem} index={0} />}
        </DragOverlay>
      </SortableContext>
    </DndContext>
  );
}
