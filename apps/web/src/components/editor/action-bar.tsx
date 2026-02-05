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
  Unlock,
  VerticalSplit,
  HorizontalSplit,
  MoreVertical
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
  MouseSensor,
  useDroppable
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
import { saveContent } from "./index";

type ToolButton = {
  title: string;
  icon: Icon | React.FC<{ size: number }>;
  enabled?: boolean;
  hidden?: boolean;
  hideOnMobile?: boolean;
  toggled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

const Remove = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 12H19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Square = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const Clone = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 11V4.2C2 3.0799 2 2.51984 2.21799 2.09202C2.40973 1.71569 2.71569 1.40973 3.09202 1.21799C3.51984 1 4.0799 1 5.2 1H13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="6"
      y="5"
      width="16"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export function EditorActionBar({ groupId }: { groupId: string }) {
  const { isMaximized, isFullscreen, hasNativeWindowControls } =
    useWindowControls();
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const activeTab = useEditorStore((store) => store.getActiveTab(groupId));
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
  const groupsCount = useEditorStore((store) => store.groups.length);
  const isTablet = useTablet();

  const [width, setWidth] = useState(1000);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const collapsed = width < 550;

  const collapsibleTools: ToolButton[] = [
    {
      title: isNotePublished ? "Published" : "Publish",
      icon: isNotePublished ? Published : Publish,
      hidden: !isLoggedIn,
      hideOnMobile: true,
      enabled:
        activeSession &&
        (activeSession.type === "default" || activeSession.type === "readonly"),
      onClick: (e) => {
        if (
          !activeSession ||
          (activeSession.type !== "default" &&
            activeSession.type !== "readonly")
        )
          return;
        showPublishView(activeSession.note, e.target as HTMLElement);
      }
    },
    {
      title: "Search",
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
      title: "Table of Contents",
      icon: TableOfContents,
      enabled:
        activeSession &&
        activeSession.type !== "locked" &&
        activeSession.type !== "diff" &&
        activeSession.type !== "conflicted",
      onClick: () => useEditorStore.getState().toggleTableOfContents(),
      toggled: isTOCVisible
    },
    {
      title: "Properties",
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
    {
      title: "Split Right",
      icon: VerticalSplit,
      enabled: true,
      onClick: () => useEditorStore.getState().splitGroup("vertical", groupId),
      hidden: isMobile
    },
    {
      title: "Split Down",
      icon: HorizontalSplit,
      enabled: true,
      onClick: () => useEditorStore.getState().splitGroup("horizontal", groupId),
      hidden: isMobile
    },
    {
      title: "Close",
      icon: Cross,
      enabled: groupsCount > 1,
      onClick: () => useEditorStore.getState().closeGroup(groupId),
      hidden: isMobile || groupsCount === 1
    }
  ];

  const tools: ToolButton[] = [
    {
      title: "New Tab",
      icon: NewTab,
      enabled: true,
      onClick: () => useEditorStore.getState().addTab(undefined, groupId)
    },
    {
      title: "Undo",
      icon: Undo,
      enabled: editorManager?.canUndo,
      onClick: () => editorManager?.editor?.undo(),
      hidden: activeSession?.type === "readonly"
    },
    {
      title: "Redo",
      icon: Redo,
      enabled: editorManager?.canRedo,
      onClick: () => editorManager?.editor?.redo(),
      hidden: activeSession?.type === "readonly"
    },
    ...(collapsed
      ? [
          {
            title: "Menu",
            icon: MoreVertical,
            enabled: true,
            onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
              Menu.openMenu(
                collapsibleTools
                  .filter((t) => {
                    const isHidden =
                      typeof t.hidden === "boolean" ? t.hidden : false;
                    return !isHidden;
                  })
                  .map((t) => ({
                    type: "button",
                    title: t.title,
                    key: t.title,
                    icon: (t.icon as any).path, // Use the path string instead of the component
                    onClick: () =>
                      t.onClick(
                        e as unknown as React.MouseEvent<
                          HTMLButtonElement,
                          MouseEvent
                        >
                      ),
                    isChecked: t.toggled,
                    isDisabled: !t.enabled
                  }))
              );
            }
          }
        ]
      : collapsibleTools),
    ...getWindowControls(
      hasNativeWindowControls,
      isFullscreen,
      isMaximized,
      isTablet,
      isMobile
    )
  ];

  return (
    <Flex
      ref={containerRef}
      sx={{
        width: "100%",
        height: "100%",
        // alignItems: "center", // Removed to allow children (like TabStrip) to stretch
        overflow: "hidden"
      }}
    >
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
        <TabStrip groupId={groupId} />
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
        {tools.map((tool, index) => (
          <Button
            data-test-id={tool.title}
            disabled={!tool.enabled}
            variant={tool.title === "Close" ? "error" : "secondary"}
            title={tool.title}
            key={`${tool.title}-${index}`}
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
    </Flex>
  );
}

export type TabStripProps = {
  // groupId is required to identify which split pane this TabStrip belongs to.
  groupId: string;
};

const TabStrip = React.memo(function TabStrip({
  groupId
}: {
  groupId: string;
}) {
  useEditorStore((store) => store.getActiveSession()); // otherwise the tab title won't update on opening a note
  // Filter tabs to only show those belonging to the current group/sidebar.
  // This is essential for the Split Panes feature where each pane has its own set of tabs.
  const tabs = useEditorStore((store) =>
    store.tabs.filter((t) => t && t.groupId === groupId)
  );
  const currentTab = useEditorStore(
    (store) => store.getGroup(groupId)?.activeTabId
  );
  const canGoBack = useEditorStore((store) => store.canGoBack);
  const canGoForward = useEditorStore((store) => store.canGoForward);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const activeGroupId = useEditorStore((store) => store.activeGroupId);
  const isGroupFocused = activeGroupId === groupId;

  return (
    <Flex
      sx={{ flex: 1 }}
      onClick={() => useEditorStore.getState().focusGroup(groupId)}
    >
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
          onClick={() => useEditorStore.getState().newSession(groupId)}
          data-test-id={`create-new-note`}
          sx={{
            p: "3px",
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
            useEditorStore.getState().addTab(undefined, groupId);
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
          {/* 
            Removed local DndContext as this list is now part of the global drag context 
            managed by AppDndContext for cross-pane dragging support.
          */}
          <ReorderableList
            items={tabs}
            groupId={groupId}
            moveItem={() => {}} // Removed usage in child
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
                  isGroupFocused={isGroupFocused}
                  isPinned={!!tab.pinned}
                  isLocked={isLockedSession(session)}
                  isRevealInListDisabled={isFocusMode}
                  type={session.type}
                  onSave={() => {
                    const { getEditor } =
                      useEditorManager.getState();
                    const editor = getEditor(session.id)?.editor;
                    if (!editor) return;
                    saveContent(session.id, false, editor.getContent());
                  }}
                  onFocus={() => {
                    if (tab.id !== currentTab) {
                      useEditorStore.getState().focusTab(tab.id);
                    } else {
                      useEditorStore.getState().focusGroup(groupId);
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
                  onOpenInNewWindow={undefined}
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
  isRevealInListDisabled: boolean;
  type: SessionType;
  onFocus: () => void;
  onClose: () => void;
  onCloseOthers: () => void;
  onCloseToTheRight: () => void;
  onCloseToTheLeft: () => void;
  onCloseAll: () => void;
  onPin: () => void;
  onSave: () => void;
  onRevealInList?: () => void;
  onOpenInNewWindow?: () => void;
  isGroupFocused?: boolean;
};
export function Tab(props: TabProps) {
  const {
    id,
    title,
    isActive,
    isPinned,
    isLocked,
    isUnsaved,
    isRevealInListDisabled,
    type,
    onFocus,
    onClose,
    onCloseAll,
    onCloseOthers,
    onCloseToTheRight,
    onCloseToTheLeft,
    onRevealInList,
    onPin,
    onSave,
    onOpenInNewWindow,
    isGroupFocused
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
          ? isGroupFocused
            ? "2px solid var(--accent)"
            : "2px solid var(--border-hover)"
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
            title: strings.save(),
            key: "save",
            onClick: onSave,
            isHidden: !isUnsaved
          },
          { type: "separator", key: "sep0", isHidden: !isUnsaved },
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
          { type: "separator", key: "sep1" },
          {
            type: "button",
            title: strings.revealInList(),
            key: "reveal-in-list",
            onClick: onRevealInList,
            isHidden: !onRevealInList,
            isDisabled: isRevealInListDisabled
          },
          { type: "separator", key: "sep2", isHidden: !onRevealInList },
          {
            type: "button",
            title: strings.openInNewWindow(),
            key: "open-in-new-window",
            onClick: onOpenInNewWindow,
            isHidden: !onOpenInNewWindow
          },
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
  props: ReorderableListProps<T> & { groupId: string }
) {
  const { items, renderItem: Item, groupId } = props;
  const { setNodeRef } = useDroppable({ id: groupId });

  return (
    <SortableContext
      id={groupId}
      items={items}
      strategy={horizontalListSortingStrategy}
    >
      <div ref={setNodeRef} style={{ display: "flex", flexDirection: "row", height: "100%", flex: 1 }}>
        {items.map((item, index) => (
          <Item key={item.id} item={item} index={index} />
        ))}
      </div>
    </SortableContext>
  );
}
