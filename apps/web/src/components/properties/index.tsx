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

import React, { PropsWithChildren } from "react";
import {
  Pin,
  StarOutline,
  Unlock,
  Readonly,
  SyncOff,
  ArrowLeft,
  Circle,
  Checkmark
} from "../icons";
import { Flex, Text } from "@theme-ui/components";
import { useStore, store, EditorSession } from "../../stores/editor-store";
import { db } from "../../common/db";
import { useStore as useAppStore } from "../../stores/app-store";
import { store as noteStore } from "../../stores/note-store";
import { AnimatedFlex } from "../animated";
import Toggle from "./toggle";
import ScrollContainer from "../scroll-container";
import { getFormattedDate } from "@notesnook/common";
import { ScopedThemeProvider } from "../theme-provider";
import { PreviewSession } from "../editor/types";
import usePromise from "../../hooks/use-promise";
import { ListItemWrapper } from "../list-container/list-profiles";
import { VirtualizedList } from "../virtualized-list";
import { ResolvedItem } from "../list-container/resolved-item";
import { SessionItem } from "../session-item";
import { COLORS } from "../../common/constants";
import { DefaultColors } from "@notesnook/core";

const tools = [
  { key: "pin", property: "pinned", icon: Pin, label: "Pin" },
  {
    key: "favorite",
    property: "favorite",
    icon: StarOutline,
    label: "Favorite"
  },
  { key: "lock", icon: Unlock, label: "Lock", property: "locked" },
  {
    key: "readonly",
    icon: Readonly,
    label: "Readonly",
    property: "readonly"
  },
  {
    key: "local-only",
    icon: SyncOff,
    label: "Disable sync",
    property: "localOnly"
  }
] as const;

type MetadataItem<T extends keyof EditorSession = keyof EditorSession> = {
  key: T;
  label: string;
  value: (value: EditorSession[T]) => string;
};

const metadataItems = [
  {
    key: "dateCreated",
    label: "Created at",
    value: (date) => getFormattedDate(date || Date.now())
  } as MetadataItem<"dateCreated">,
  {
    key: "dateEdited",
    label: "Last edited at",
    value: (date) => (date ? getFormattedDate(date) : "never")
  } as MetadataItem<"dateEdited">
];

type EditorPropertiesProps = {
  onOpenPreviewSession: (session: PreviewSession) => void;
};
function EditorProperties(props: EditorPropertiesProps) {
  const { onOpenPreviewSession } = props;

  const toggleProperties = useStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const session = useStore((store) => store.session);

  const { id: sessionId, sessionType, dateCreated } = session;
  const isPreviewMode = sessionType === "preview";

  if (isFocusMode || !sessionId) return null;
  return (
    <AnimatedFlex
      animate={{
        x: 0
      }}
      transition={{
        duration: 0.1,
        bounceDamping: 1,
        bounceStiffness: 1,
        ease: "easeOut"
      }}
      initial={{ x: 600 }}
      sx={{
        display: "flex",
        position: "absolute",
        right: 0,
        zIndex: 3,
        height: "100%",
        width: "300px",
        borderLeft: "1px solid",
        borderLeftColor: "border"
      }}
    >
      <ScopedThemeProvider
        scope="editorSidebar"
        sx={{
          flex: 1,
          display: "flex",
          bg: "background",
          overflowY: "hidden",
          overflowX: "hidden",
          flexDirection: "column"
        }}
      >
        <ScrollContainer>
          <Section
            title="Properties"
            button={
              <ArrowLeft
                data-test-id="properties-close"
                onClick={() => toggleProperties(false)}
                size={18}
                sx={{ mr: 1, cursor: "pointer" }}
              />
            }
          >
            {!isPreviewMode && (
              <>
                {tools.map((tool) => (
                  <Toggle
                    {...tool}
                    key={tool.key}
                    toggleKey={tool.property}
                    onToggle={() => changeToggleState(tool.key)}
                    testId={`properties-${tool.key}`}
                  />
                ))}
              </>
            )}
            {metadataItems.map((item) => (
              <Flex
                key={item.key}
                py={2}
                px={2}
                sx={{
                  borderBottom: "1px solid var(--separator)",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <Text variant="subBody" sx={{ fontSize: "body" }}>
                  {item.label}
                </Text>
                <Text
                  className="selectable"
                  variant="subBody"
                  sx={{ fontSize: "body" }}
                >
                  {item.value(session[item.key])}
                </Text>
              </Flex>
            ))}
            {!isPreviewMode && <Colors noteId={sessionId} />}
          </Section>
          <Notebooks noteId={sessionId} />
          <Reminders noteId={sessionId} />
          <Attachments noteId={sessionId} />
          <SessionHistory
            noteId={sessionId}
            dateCreated={dateCreated || 0}
            isPreviewMode={isPreviewMode}
            onOpenPreviewSession={onOpenPreviewSession}
          />
        </ScrollContainer>
      </ScopedThemeProvider>
    </AnimatedFlex>
  );
}
export default React.memo(EditorProperties);

function Colors({ noteId }: { noteId: string }) {
  const color = useStore((store) => store.color);
  const result = usePromise(
    async () =>
      (
        await db.relations.to({ id: noteId, type: "note" }, "color").resolve(1)
      ).at(0),
    [color]
  );
  console.log(result);
  return (
    <Flex
      py={2}
      px={2}
      sx={{
        cursor: "pointer",
        justifyContent: "center"
      }}
    >
      {COLORS.map((label) => {
        const isChecked =
          result.status === "fulfilled" &&
          DefaultColors[label.key] === result.value?.colorCode;
        return (
          <Flex
            key={label.key}
            onClick={() => noteStore.get().setColor(label, isChecked, noteId)}
            sx={{
              cursor: "pointer",
              position: "relative",
              alignItems: "center",
              justifyContent: "space-between"
            }}
            data-test-id={`properties-${label.key}`}
          >
            <Circle
              size={35}
              color={DefaultColors[label.key]}
              data-test-id={`toggle-state-${isChecked ? "on" : "off"}`}
            />
            {isChecked && (
              <Checkmark
                color="white"
                size={18}
                sx={{ position: "absolute", left: "8px" }}
              />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}

function Notebooks({ noteId }: { noteId: string }) {
  const result = usePromise(() =>
    db.relations
      .to({ id: noteId, type: "note" }, "notebook")
      .selector.sorted(db.settings.getGroupOptions("notebooks"))
  );

  if (result.status !== "fulfilled" || result.value.ids.length <= 0)
    return null;

  return (
    <Section title="Notebooks">
      <VirtualizedList
        mode="fixed"
        estimatedSize={50}
        getItemKey={(index) => result.value.getKey(index)}
        items={result.value.ungrouped}
        renderItem={({ item: id }) => (
          <ListItemWrapper id={id} items={result.value} simplified />
        )}
      />
    </Section>
  );
}
function Reminders({ noteId }: { noteId: string }) {
  const result = usePromise(() =>
    db.relations
      .from({ id: noteId, type: "note" }, "reminder")
      .selector.sorted(db.settings.getGroupOptions("reminders"))
  );
  if (result.status !== "fulfilled" || result.value.ids.length <= 0)
    return null;

  return (
    <Section title="Reminders">
      <VirtualizedList
        mode="fixed"
        estimatedSize={54}
        getItemKey={(index) => result.value.getKey(index)}
        items={result.value.ungrouped}
        renderItem={({ item: id }) => (
          <ListItemWrapper id={id} items={result.value} simplified />
        )}
      />
    </Section>
  );
}
function Attachments({ noteId }: { noteId: string }) {
  const result = usePromise(() =>
    db.attachments
      .ofNote(noteId, "all")
      .sorted({ sortBy: "dateCreated", sortDirection: "desc" })
  );
  if (result.status !== "fulfilled" || result.value.ids.length <= 0)
    return null;

  return (
    <Section title="Attachments">
      {result.value.ids.map((id, index) => (
        <ListItemWrapper
          key={result.value.getKey(index)}
          id={id as string}
          items={result.value}
          compact
        />
      ))}
    </Section>
  );
}
function SessionHistory({
  noteId,
  dateCreated,
  isPreviewMode,
  onOpenPreviewSession
}: {
  noteId: string;
  dateCreated: number;
  isPreviewMode: boolean;
  onOpenPreviewSession: (session: PreviewSession) => void;
}) {
  const result = usePromise(() =>
    db.noteHistory
      .get(noteId)
      .sorted({ sortBy: "dateModified", sortDirection: "desc" })
  );
  if (result.status !== "fulfilled" || result.value.ids.length <= 0)
    return null;

  return (
    <Section
      title="Previous Sessions"
      subtitle={"Your session history is local only."}
    >
      <VirtualizedList
        mode="fixed"
        estimatedSize={28}
        getItemKey={(index) => result.value.getKey(index)}
        items={result.value.ungrouped}
        renderItem={({ item: id }) => (
          <ResolvedItem type="session" id={id} items={result.value}>
            {({ item }) => (
              <SessionItem
                noteId={noteId}
                session={item}
                dateCreated={dateCreated}
                isPreviewMode={isPreviewMode}
                onOpenPreviewSession={onOpenPreviewSession}
              />
            )}
          </ResolvedItem>
        )}
      />
    </Section>
  );
}

type SectionProps = { title: string; subtitle?: string; button?: JSX.Element };
function Section({
  title,
  subtitle,
  button,
  children
}: PropsWithChildren<SectionProps>) {
  return (
    <Flex
      sx={{
        borderRadius: "default",
        flexDirection: "column"
      }}
    >
      <Flex mx={2} mt={2} sx={{ alignItems: "center" }}>
        {button}
        <Text variant="subtitle">{title}</Text>
      </Flex>
      {subtitle && (
        <Text variant="subBody" mb={1} mx={2}>
          {subtitle}
        </Text>
      )}
      {children}
    </Flex>
  );
}

function changeToggleState(
  prop: "lock" | "readonly" | "local-only" | "pin" | "favorite"
) {
  const {
    id: sessionId,
    locked,
    readonly,
    localOnly,
    pinned,
    favorite
  } = store.get().session;
  if (!sessionId) return;
  switch (prop) {
    case "lock":
      return locked ? noteStore.unlock(sessionId) : noteStore.lock(sessionId);
    case "readonly":
      return noteStore.readonly(!readonly, sessionId);
    case "local-only":
      return noteStore.localOnly(!localOnly, sessionId);
    case "pin":
      return noteStore.pin(!pinned, sessionId);
    case "favorite":
      return noteStore.favorite(!favorite, sessionId);
    default:
      return;
  }
}
