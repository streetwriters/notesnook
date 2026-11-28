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

import {
  Button,
  Flex,
  Text,
  Box,
  ScrollContainer,
  SortableList
} from "@notesnook/ui-kit";
import React from "react";
import { environment } from "@platform";
import {
  ArrowLeft,
  ArrowRight,
  Close,
  CloudArrowUp,
  CloudCheck,
  Command,
  Cross,
  DotsThree,
  FileText,
  Icon,
  LeftPanelClose,
  LeftPanelOpen,
  Lock,
  LockOpen,
  MagnifyingGlass,
  NewTab,
  Note,
  NoteRemove,
  PencilSimpleSlash,
  Pin,
  Plus,
  Properties,
  Publish,
  Published,
  PushPinSimple,
  Readonly,
  Redo,
  ScanDelete,
  Search,
  TableOfContents,
  Trash,
  Undo,
  Unlock
} from "../icons";
import {
  SaveState,
  SessionType,
  isLockedSession,
  useEditorStore
} from "../../stores/editor-store";
import { Menu } from "../../hooks/use-menu";
import { useStore as useAppStore } from "../../stores/app-store";
import { useEditorManager } from "./manager";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { useWindowControls } from "../../hooks/use-window-controls";
import { useStore as useMonographStore } from "../../stores/monograph-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { db } from "../../common/db";
import { PublishDialog } from "../publish-view";
import useMobile from "../../hooks/use-mobile";
import { strings } from "@notesnook/intl";
import { getWindowControls } from "../title-bar";
import useTablet from "../../hooks/use-tablet";
import { isMac } from "../../utils/platform";
import { CREATE_BUTTON_MAP } from "../../common";
import { getDragData } from "../../utils/data-transfer";
import { saveContent } from "./index";
import { IS_DESKTOP_APP } from "../../dialogs/desktop-bridge";
import { CommandPaletteDialog } from "../../dialogs/command-palette";

type ToolButton = {
  title: string;
  icon: Icon;
  enabled?: boolean;
  hidden?: boolean;
  hideOnMobile?: boolean;
  toggled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

type EditorActionBarProps = {
  isMobileEditorActive: boolean;
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
};

export function EditorActionBar({
  isMobileEditorActive,
  isSidebarCollapsed,
  onSidebarToggle
}: EditorActionBarProps) {
  const { isMaximized, isFullscreen, hasNativeWindowControls } =
    useWindowControls();
  const activeTab = useEditorStore((store) => store.getActiveTab());
  const activeSession = useEditorStore((store) =>
    activeTab ? store.getSession(activeTab.sessionId) : undefined
  );
  const editorManager = useEditorManager((store) =>
    activeSession?.id ? store.editors[activeSession?.id] : undefined
  );
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const propertiesTab = useEditorStore((store) => store.propertiesTab);
  const monographs = useMonographStore((store) => store.monographs);
  const isNotePublished =
    activeSession &&
    "note" in activeSession &&
    db.monographs.isPublished(activeSession.note.id);
  const isMobile = useMobile();
  const isTablet = useTablet();

  const tools: ToolButton[] = [
    {
      title: isNotePublished ? strings.published() : strings.publish(),
      icon: isNotePublished ? CloudCheck : CloudArrowUp,
      hidden: !isLoggedIn,
      hideOnMobile: true,
      enabled:
        activeSession &&
        (activeSession.type === "default" || activeSession.type === "readonly"),
      onClick: () => {
        if (
          !activeSession ||
          (activeSession.type !== "default" &&
            activeSession.type !== "readonly")
        )
          return;
        PublishDialog.show({ note: activeSession.note });
      }
    },
    {
      title: strings.search(),
      icon: MagnifyingGlass,
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
      icon: DotsThree,
      enabled:
        activeSession &&
        activeSession.type !== "new" &&
        activeSession.type !== "locked" &&
        activeSession.type !== "conflicted",
      onClick: () =>
        useEditorStore
          .getState()
          .setPropertiesTab(
            propertiesTab === undefined ? "properties" : undefined
          ),
      toggled: propertiesTab !== undefined
    }
  ];
  const windowControls = getWindowControls(
    hasNativeWindowControls,
    isFullscreen,
    isMaximized,
    isTablet,
    isMobile
  );
  const areWindowControlsVisible = windowControls.some(
    (control) => !control.hidden
  );

  return (
    <>
      {IS_DESKTOP_APP &&
        isMac() &&
        !isFullscreen &&
        !environment.hasNativeTitlebar && (
          <Separator
            sx={{
              alignSelf: "center",
              mx: "spacing4"
            }}
          />
        )}
      <Button
        data-test-id="sidebar-toggle"
        sx={{
          bg: "transparent",
          flexShrink: 0,
          borderRadius: "radius1",
          alignSelf: "center",
          width: "20px",
          height: "20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
        onClick={onSidebarToggle}
      >
        {isSidebarCollapsed ? (
          <LeftPanelOpen size={15} />
        ) : (
          <LeftPanelClose size={15} />
        )}
      </Button>
      {isMobile ? (
        <Flex sx={{ flex: 1, ml: "spacing4" }}>
          <Button
            data-test-id="mobile-editor-back"
            disabled={!isMobileEditorActive}
            sx={{
              bg: "transparent",
              flexShrink: 0,
              borderRadius: "radius1",
              alignSelf: "center",
              width: "20px",
              height: "20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
            onClick={() =>
              AppEventManager.publish(AppEvents.toggleEditor, false)
            }
          >
            <ArrowLeft size={15} />
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
              : 0,
          ml: "spacing2",
          gap: "spacing2",
          flexShrink: 0,
          my: "spacing3"
        }}
      >
        <Button
          data-test-id="command-palette"
          title={strings.command()}
          onClick={() => CommandPaletteDialog.show({ isCommandMode: true })}
          sx={{
            gap: "spacing3",
            p: "spacing2",
            height: "25px",
            borderRadius: "radius1",
            bg: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Command size={15} color="icon" />
          <Text
            sx={{
              color: "paragraph",
              fontSize: "xs",
              fontWeight: 500,
              lineHeight: 1
            }}
          >
            Command
          </Text>
        </Button>
        <Separator />
        {tools.map((tool, index) => (
          <React.Fragment key={tool.title}>
            <Button
              data-test-id={tool.title}
              disabled={!tool.enabled}
              variant={tool.title === "Close" ? "error" : "secondary"}
              title={tool.title}
              key={tool.title}
              sx={{
                borderRadius: "radius1",
                width: "20px",
                height: "20px",
                justifyContent: "center",
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
              <tool.icon size={15} />
            </Button>
            {!tool.hidden &&
              index < tools.length - 1 &&
              !tools[index + 1].hidden && (
                <Separator
                  sx={{
                    display: [
                      "hideOnMobile" in tool && tool.hideOnMobile
                        ? "none"
                        : "block",
                      "block"
                    ]
                  }}
                />
              )}
          </React.Fragment>
        ))}
      </Flex>
      {areWindowControlsVisible && (
        <>
          <Separator
            sx={{
              alignSelf: "center",
              mr: "spacing4"
            }}
          />
          <Flex
            sx={{
              alignItems: "center",
              justifyContent: "center",
              gap: "spacing3",
              flexShrink: 0,
              my: "spacing3"
            }}
          >
            {windowControls.map((tool, index) => (
              <Button
                data-test-id={tool.title}
                disabled={!tool.enabled}
                variant={tool.title === "Close" ? "error" : "secondary"}
                title={tool.title}
                key={tool.title}
                sx={{
                  borderRadius: "radius1",
                  width: "20px",
                  height: "20px",
                  justifyContent: "center",
                  alignItems: "center",
                  bg: "transparent",
                  display: tool.hidden ? "none" : "Flex",
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
                <tool.icon size={15} />
              </Button>
            ))}
          </Flex>
        </>
      )}
    </>
  );
}

const TabStrip = React.memo(function TabStrip() {
  const tabs = useEditorStore((store) => store.tabs);
  const currentTab = useEditorStore((store) => store.activeTabId);
  const canGoBack = useEditorStore((store) => store.canGoBack);
  const canGoForward = useEditorStore((store) => store.canGoForward);
  const isFocusMode = useAppStore((store) => store.isFocusMode);

  return (
    <Flex sx={{ flex: 1 }}>
      <Flex
        sx={{
          px: "spacing4",
          alignItems: "center",
          flexShrink: 0,
          gap: "spacing4",
          my: "spacing3"
        }}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <Button
          disabled={!canGoBack}
          onClick={() => useEditorStore.getState().goBack()}
          sx={{
            width: "20px",
            height: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: "1 !important",
            "&:hover svg path": {
              fill: canGoBack ? "var(--icon-selected) !important" : ""
            }
          }}
          data-test-id="go-back"
        >
          <ArrowLeft size={15} color={canGoBack ? "icon" : "icon-disabled"} />
        </Button>
        <Button
          disabled={!canGoForward}
          onClick={() => useEditorStore.getState().goForward()}
          sx={{
            width: "20px",
            height: "20px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: "1 !important",
            "&:hover svg path": {
              fill: canGoForward ? "var(--icon-selected) !important" : ""
            }
          }}
          data-test-id="go-forward"
        >
          <ArrowRight
            size={15}
            color={canGoForward ? "icon" : "icon-disabled"}
          />
        </Button>
      </Flex>
      <ScrollContainer
        className="tabsScroll"
        suppressScrollY
        style={{ flex: "0 1 auto", minWidth: 0, height: "100%" }}
        trackStyle={() => ({
          backgroundColor: "transparent",
          "--ms-track-size": "6px"
        })}
        thumbStyle={() => ({ height: 3 })}
      >
        <Flex
          sx={{
            height: "100%",
            gap: "spacing3",
            py: "spacing3"
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
                  isRevealInListDisabled={isFocusMode}
                  type={session.type}
                  onSave={() => {
                    const { activeEditorId, getEditor } =
                      useEditorManager.getState();
                    const editor = getEditor(activeEditorId || "")?.editor;
                    if (!editor) return;
                    saveContent(session.id, false, editor.getContent());
                  }}
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
        </Flex>
      </ScrollContainer>
      <Button
        variant="secondary"
        data-test-id="create-new-note"
        title={strings.newTab()}
        onClick={() => useEditorStore.getState().addTab()}
        sx={{
          width: "20px",
          height: "20px",
          p: 0,
          mx: "spacing3",
          borderRadius: "radius1",
          bg: "hover",
          alignSelf: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0
        }}
      >
        <Plus size={11} />
      </Button>
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
};
function Tab(props: TabProps) {
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
    onSave
  } = props;
  const Icon = isLocked
    ? type === "locked"
      ? Lock
      : LockOpen
    : type === "readonly"
    ? PencilSimpleSlash
    : type === "deleted"
    ? Trash
    : isUnsaved
    ? ScanDelete
    : FileText;
  return (
    <Flex
      id={`tab-${id}`}
      className={`tab${isActive ? " active" : ""}`}
      group="tab"
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
        py: "spacing4",
        px: "spacing3",
        borderRadius: "radius2",
        cursor: "pointer",
        bg: isActive ? "background-tertiary" : "transparent",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        ":hover": {
          bg: isActive ? "background-tertiary" : "hover"
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
        <Button
          variant="secondary"
          sx={{
            ml: "spacing2",
            bg: "transparent",
            borderRadius: "radius1",
            width: "15px",
            height: "15px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 0
          }}
          onClick={onPin}
        >
          <PushPinSimple size={11} />
        </Button>
      ) : (
        <Button
          variant="secondary"
          sx={{
            ml: "spacing2",
            bg: "transparent",
            borderRadius: "radius1",
            width: "15px",
            height: "15px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: isActive ? 1 : 0,
            ":group-hover": { group: "tab", style: { opacity: 1 } },
            p: 0
          }}
          onClick={onClose}
          className="closeTabButton"
          data-test-id={"tab-close-button"}
        >
          <Close size={11} />
        </Button>
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
  return (
    <SortableList
      direction="horizontal"
      items={items}
      onMove={({ activeId, overId }) => {
        const from = items.findIndex((i) => i.id === activeId);
        const to = items.findIndex((i) => i.id === overId);
        if (from < 0 || to < 0) return;
        moveItem(from, to);
      }}
      renderItem={(item) => <Item item={item} index={items.indexOf(item)} />}
    />
  );
}

function Separator({ sx }: { sx?: React.ComponentProps<typeof Box>["sx"] }) {
  return (
    <Box
      sx={{
        width: "1px",
        height: "13px",
        backgroundColor: "separator",
        ...sx
      }}
    />
  );
}
