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

import { memo } from "react";
import { strings } from "@notesnook/intl";
import { Box, Button, Flex, Text } from "@ui";
import { environment } from "@platform";
import {
  ArrowLeft,
  ArrowRight,
  Close,
  Command,
  DotsThree,
  FileText,
  LeftPanelClose,
  LeftPanelOpen,
  Lock,
  LockOpen,
  MagnifyingGlass,
  PencilSimpleSlash,
  Plus,
  PushPinSimple,
  ScanDelete,
  Trash,
  type Icon
} from "../icons";
import {
  isLockedSession,
  SaveState,
  useEditorStore,
  type SessionType
} from "../../stores/editor-store";
import { useWindowControls } from "../../hooks/use-window-controls";

const TRAFFIC_LIGHTS_WIDTH = 78;

function Separator() {
  return <Box sx={{ width: 1, height: 13, bg: "separator" }} />;
}

export function ActionBar(props: {
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}) {
  const { isFullscreen } = useWindowControls();
  const activeTab = useEditorStore((store) => store.getActiveTab());
  const activeSession = useEditorStore((store) =>
    activeTab ? store.getSession(activeTab.sessionId) : undefined
  );
  const propertiesTab = useEditorStore((store) => store.propertiesTab);
  const isMac = environment.os === "macOS";
  const sessionType = activeSession?.type;
  const canSearch =
    activeSession !== undefined &&
    sessionType !== "new" &&
    sessionType !== "locked" &&
    sessionType !== "diff" &&
    sessionType !== "conflicted";
  const canOpenProperties =
    activeSession !== undefined &&
    sessionType !== "new" &&
    sessionType !== "locked" &&
    sessionType !== "conflicted";
  const tools: {
    id: string;
    icon: Icon;
    enabled: boolean;
    toggled?: boolean;
    onPress: () => void;
  }[] = [
    {
      id: "Search",
      icon: MagnifyingGlass,
      enabled: canSearch,
      onPress: () => undefined
    },
    {
      id: "Properties",
      icon: DotsThree,
      enabled: canOpenProperties,
      toggled: propertiesTab !== undefined,
      onPress: () =>
        useEditorStore
          .getState()
          .setPropertiesTab(
            propertiesTab === undefined ? "properties" : undefined
          )
    }
  ];

  return (
    <>
      {isMac && !isFullscreen ? (
        <Box sx={{ width: TRAFFIC_LIGHTS_WIDTH, flexShrink: 0 }} />
      ) : null}
      <Button
        testID="sidebar-toggle"
        variant="tertiary"
        onPress={props.onSidebarToggle}
        sx={{
          bg: "transparent",
          flexShrink: 0,
          borderRadius: "radius1",
          alignSelf: "center",
          width: 20,
          height: 20,
          alignItems: "center",
          justifyContent: "center",
          p: 0
        }}
      >
        {props.isSidebarCollapsed ? (
          <LeftPanelOpen size={15} />
        ) : (
          <LeftPanelClose size={15} />
        )}
      </Button>
      <TabStrip />
      <Flex
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          ml: "spacing2",
          gap: "spacing2",
          flexShrink: 0,
          my: "spacing3"
        }}
      >
        <Button
          testID="command-palette"
          variant="tertiary"
          sx={{
            flexDirection: "row",
            gap: "spacing3",
            p: "spacing2",
            height: 25,
            borderRadius: "radius1",
            bg: "transparent",
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
            {strings.command()}
          </Text>
        </Button>
        <Separator />
        {tools.map((tool, index) => (
          <Flex
            key={tool.id}
            sx={{
              flexDirection: "row",
              alignItems: "center",
              gap: "spacing2"
            }}
          >
            <Button
              testID={tool.id}
              variant="secondary"
              disabled={!tool.enabled}
              onPress={tool.onPress}
              sx={{
                borderRadius: "radius1",
                width: 20,
                height: 20,
                justifyContent: "center",
                alignItems: "center",
                bg: tool.toggled ? "background-selected" : "transparent",
                flexShrink: 0,
                p: 0
              }}
            >
              <tool.icon size={15} />
            </Button>
            {index < tools.length - 1 ? <Separator /> : null}
          </Flex>
        ))}
      </Flex>
    </>
  );
}

const TabStrip = memo(function TabStrip() {
  const tabs = useEditorStore((store) => store.tabs);
  const currentTab = useEditorStore((store) => store.activeTabId);
  const canGoBack = useEditorStore((store) => store.canGoBack);
  const canGoForward = useEditorStore((store) => store.canGoForward);
  useEditorStore((store) => store.sessions);

  return (
    <Flex sx={{ flex: 1, flexDirection: "row" }}>
      <Flex
        sx={{
          flexDirection: "row",
          px: "spacing4",
          alignItems: "center",
          flexShrink: 0,
          gap: "spacing4",
          my: "spacing3"
        }}
      >
        <Button
          testID="go-back"
          variant="tertiary"
          disabled={!canGoBack}
          onPress={() => useEditorStore.getState().goBack()}
          sx={{
            width: 20,
            height: 20,
            alignItems: "center",
            justifyContent: "center",
            bg: "transparent",
            p: 0,
            opacity: 1
          }}
        >
          <ArrowLeft size={15} color={canGoBack ? "icon" : "icon-disabled"} />
        </Button>
        <Button
          testID="go-forward"
          variant="tertiary"
          disabled={!canGoForward}
          onPress={() => useEditorStore.getState().goForward()}
          sx={{
            width: 20,
            height: 20,
            alignItems: "center",
            justifyContent: "center",
            bg: "transparent",
            p: 0,
            opacity: 1
          }}
        >
          <ArrowRight
            size={15}
            color={canGoForward ? "icon" : "icon-disabled"}
          />
        </Button>
      </Flex>
      <Flex
        testID="tabs"
        sx={{
          flexDirection: "row",
          flexShrink: 1,
          minWidth: 0,
          height: "100%",
          gap: "spacing3",
          py: "spacing3"
        }}
      >
        {tabs.map((tab) => {
          const session = useEditorStore.getState().getSession(tab.sessionId);
          if (!session) return null;
          const isUnsaved =
            session.type === "default" &&
            session.saveState === SaveState.NotSaved;
          return (
            <Tab
              key={tab.sessionId}
              id={tab.id}
              title={
                session.title ||
                ("note" in session ? session.note.title : strings.untitled())
              }
              isUnsaved={isUnsaved}
              isActive={tab.id === currentTab}
              isPinned={!!tab.pinned}
              isLocked={isLockedSession(session)}
              type={session.type}
              onFocus={() => {
                if (tab.id !== currentTab)
                  useEditorStore.getState().activateSession(tab.sessionId);
              }}
              onClose={() => useEditorStore.getState().closeTabs(tab.id)}
              onPin={() => useEditorStore.getState().pinTab(tab.id)}
            />
          );
        })}
      </Flex>
      <Button
        testID="create-new-note"
        variant="secondary"
        onPress={() => useEditorStore.getState().addTab()}
        sx={{
          width: 20,
          height: 20,
          p: 0,
          mx: "spacing3",
          borderRadius: "radius1",
          bg: "hover",
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0
        }}
      >
        <Plus size={11} />
      </Button>
    </Flex>
  );
});

function Tab(props: {
  id: string;
  title: string;
  isActive: boolean;
  isPinned: boolean;
  isLocked: boolean;
  isUnsaved: boolean;
  type: SessionType;
  onFocus: () => void;
  onClose: () => void;
  onPin: () => void;
}) {
  const { isActive, isPinned, isLocked, isUnsaved, type } = props;
  const TabIcon: Icon = isLocked
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
      testID={`tab-${props.id}`}
      group="tab"
      onPress={props.onFocus}
      sx={{
        flexDirection: "row",
        py: "spacing4",
        px: "spacing3",
        borderRadius: "radius2",
        bg: isActive ? "background-tertiary" : "transparent",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        ":hover": { bg: isActive ? "background-tertiary" : "hover" }
      }}
    >
      <Flex sx={{ flexDirection: "row", alignItems: "center" }}>
        <TabIcon
          testID={isUnsaved ? "tab-icon-unsaved" : "tab-icon"}
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
          testID="tab-title"
          variant="body"
          numberOfLines={1}
          sx={{
            maxWidth: 120,
            ml: 1,
            color: isActive ? "paragraph-selected" : "paragraph-secondary"
          }}
        >
          {props.title}
        </Text>
      </Flex>
      {isPinned ? (
        <Button
          variant="secondary"
          onPress={props.onPin}
          sx={{
            ml: "spacing2",
            bg: "transparent",
            borderRadius: "radius1",
            width: 15,
            height: 15,
            alignItems: "center",
            justifyContent: "center",
            p: 0
          }}
        >
          <PushPinSimple size={11} />
        </Button>
      ) : (
        <Button
          testID="tab-close-button"
          variant="secondary"
          onPress={props.onClose}
          sx={{
            ml: "spacing2",
            bg: "transparent",
            borderRadius: "radius1",
            width: 15,
            height: 15,
            alignItems: "center",
            justifyContent: "center",
            p: 0,
            opacity: isActive ? 1 : 0,
            ":group-hover": { group: "tab", style: { opacity: 1 } }
          }}
        >
          <Close size={11} />
        </Button>
      )}
    </Flex>
  );
}
