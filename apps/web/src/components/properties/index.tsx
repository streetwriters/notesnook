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

import React, { PropsWithChildren, useState } from "react";
import {
  Pin,
  StarOutline,
  Unlock,
  Readonly,
  SyncOff,
  ArrowLeft,
  Circle,
  Checkmark,
  ChevronDown,
  ChevronRight
} from "../icons";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import {
  useEditorStore,
  ReadonlyEditorSession,
  DefaultEditorSession
} from "../../stores/editor-store";
import { db } from "../../common/db";
import { useStore as useAppStore } from "../../stores/app-store";
import { store as noteStore } from "../../stores/note-store";
import Toggle from "./toggle";
import ScrollContainer from "../scroll-container";
import {
  getFormattedDate,
  usePromise,
  ResolvedItem,
  useResolvedItem
} from "@notesnook/common";
import { ScopedThemeProvider } from "../theme-provider";
import { ListItemWrapper } from "../list-container/list-profiles";
import { VirtualizedList } from "../virtualized-list";
import { SessionItem } from "../session-item";
import {
  ContentBlock,
  Note,
  VirtualizedGrouping,
  createInternalLink,
  highlightInternalLinks
} from "@notesnook/core";
import { VirtualizedTable } from "../virtualized-table";
import { TextSlice } from "@notesnook/core";
import { TITLE_BAR_HEIGHT } from "../title-bar";
import { strings } from "@notesnook/intl";

const tools = [
  { key: "pin", property: "pinned", icon: Pin, label: strings.pin() },
  {
    key: "favorite",
    property: "favorite",
    icon: StarOutline,
    label: strings.favorite()
  },
  { key: "lock", icon: Unlock, label: strings.lock(), property: "locked" },
  {
    key: "readonly",
    icon: Readonly,
    label: strings.readOnly(),
    property: "readonly"
  },
  {
    key: "local-only",
    icon: SyncOff,
    label: strings.disableSync(),
    property: "localOnly"
  }
] as const;

type MetadataItem<T extends "dateCreated" | "dateEdited"> = {
  key: T;
  label: string;
  value: (value: number) => string;
};

const metadataItems = [
  {
    key: "dateCreated",
    label: strings.createdAt(),
    value: (date) => getFormattedDate(date || Date.now())
  } as MetadataItem<"dateCreated">,
  {
    key: "dateEdited",
    label: strings.lastEditedAt(),
    value: (date) => (date ? getFormattedDate(date) : "never")
  } as MetadataItem<"dateEdited">
];

type EditorPropertiesProps = {
  sessionId: string;
};
function EditorProperties(props: EditorPropertiesProps) {
  const toggleProperties = useEditorStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const session = useEditorStore((store) =>
    store.getSession(props.sessionId, ["default", "readonly", "deleted"])
  );
  if (isFocusMode || !session) return null;
  return (
    <Flex
      css={`@keyframes slideIn {
      from {
        transform: translateX(600px);
      }
      to {
        transform: translateX(0);
      }`}
      sx={{
        transform: "translateX(600)",
        animation: "0.1s ease-out 0s 1 slideIn",
        display: "flex",
        position: "absolute",
        top: TITLE_BAR_HEIGHT,
        right: 0,
        zIndex: 999,
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
            title={strings.properties()}
            button={
              <ArrowLeft
                data-test-id="properties-close"
                onClick={() => toggleProperties(false)}
                size={18}
                sx={{ mr: 1, cursor: "pointer" }}
              />
            }
          >
            {session.type === "deleted" ? null : (
              <>
                {tools.map((tool) => (
                  <Toggle
                    {...tool}
                    key={tool.key}
                    isOn={
                      tool.property === "locked"
                        ? "locked" in session && !!session.locked
                        : !!session.note[tool.property]
                    }
                    onToggle={() => changeToggleState(tool.key, session)}
                    testId={`properties-${tool.key}`}
                  />
                ))}
              </>
            )}

            {metadataItems.map((item) => (
              <Flex
                key={item.key}
                py={2}
                px={1}
                sx={{
                  borderBottom: "1px solid var(--separator)",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1
                }}
              >
                <Text
                  variant="subBody"
                  sx={{
                    fontSize: "body",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  className="selectable"
                  variant="subBody"
                  sx={{ fontSize: "body", flexShrink: 0 }}
                >
                  {item.value(session.note[item.key])}
                </Text>
              </Flex>
            ))}
            {session.type === "deleted" ? null : (
              <Colors noteId={session.note.id} color={session.color} />
            )}
          </Section>
          {session.type === "deleted" ? null : (
            <>
              <InternalLinks noteId={session.note.id} />
              <Notebooks noteId={session.note.id} />
              <Reminders noteId={session.note.id} />
              <Attachments noteId={session.note.id} />
              <SessionHistory noteId={session.note.id} />
            </>
          )}
        </ScrollContainer>
      </ScopedThemeProvider>
    </Flex>
  );
}
export default React.memo(EditorProperties);

enum InternalLinksTabs {
  LINKED_NOTES = 0,
  REFERENCED_IN = 1
}
function InternalLinks({ noteId }: { noteId: string }) {
  const [tabIndex, setTabIndex] = useState(InternalLinksTabs.LINKED_NOTES);
  const [expandedId, setExpandedId] = useState<string>();

  const result = usePromise(() => {
    const links =
      tabIndex === InternalLinksTabs.LINKED_NOTES
        ? db.relations.from({ id: noteId, type: "note" }, "note")
        : db.relations.to({ id: noteId, type: "note" }, "note");
    return links.selector.sorted(db.settings.getGroupOptions("notes"));
  }, [tabIndex, noteId]);

  return (
    <Flex sx={{ flexDirection: "column", mt: 2 }}>
      <Flex
        sx={{
          justifyContent: "stretch",
          borderRadius: "default",
          overflow: "hidden",
          mx: 1,
          mb: 1
        }}
      >
        {[strings.linkedNotes(), strings.referencedIn()].map((title, index) => (
          <Button
            key={title}
            variant="secondary"
            sx={{
              flex: 1,
              borderRadius: 0,
              color: tabIndex === index ? "accent-selected" : "paragraph",
              bg:
                tabIndex === index
                  ? "background-selected"
                  : "background-secondary"
            }}
            onClick={() => {
              setTabIndex(index);
              setExpandedId(undefined);
            }}
          >
            {title}
          </Button>
        ))}
      </Flex>

      {result.status === "fulfilled" &&
        (result.value.length === 0 ? (
          <Text variant="body" mx={1}>
            {tabIndex === InternalLinksTabs.LINKED_NOTES
              ? strings.notLinked()
              : strings.notReferenced()}
          </Text>
        ) : (
          <VirtualizedList
            mode="dynamic"
            estimatedSize={25}
            getItemKey={(index) => result.value.key(index)}
            items={result.value.placeholders}
            context={{
              items: result.value,
              tabIndex,
              noteId,
              isExpanded: (id) => expandedId === id,
              toggleExpand: (id) =>
                setExpandedId((s) => (s === id ? undefined : id))
            }}
            renderItem={InternalLinkItem}
          />
        ))}
    </Flex>
  );
}

function InternalLinkItem({
  index,
  context
}: {
  item: boolean;
  index: number;
  context: {
    items: VirtualizedGrouping<Note>;
    tabIndex: InternalLinksTabs;
    noteId: string;
    isExpanded: (id: string) => boolean;
    toggleExpand: (id: string) => void;
  };
}) {
  const { items, tabIndex, noteId, isExpanded, toggleExpand } = context;
  const item = useResolvedItem({ items, index });

  if (!item || item.item?.type !== "note") return null;

  if (tabIndex === InternalLinksTabs.LINKED_NOTES)
    return (
      <LinkedNote
        item={item.item}
        noteId={noteId}
        isExpanded={isExpanded(item.item.id)}
        toggleExpand={() => toggleExpand(item.item!.id)}
      />
    );
  return (
    <ReferencedIn
      item={item.item}
      noteId={noteId}
      isExpanded={isExpanded(item.item.id)}
      toggleExpand={() => toggleExpand(item.item!.id)}
    />
  );
}
function LinkedNote({
  item,
  noteId,
  isExpanded,
  toggleExpand
}: {
  item: Note;
  noteId: string;
  toggleExpand: () => void;
  isExpanded: boolean;
}) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  return (
    <>
      <Button
        variant="menuitem"
        sx={{
          p: 1,
          width: "100%",
          textAlign: "left",
          display: "flex",
          justifyContent: "start",
          alignItems: "center",
          borderBottom: isExpanded ? "none" : "1px solid var(--border)"
        }}
        onClick={() => useEditorStore.getState().openSession(item)}
      >
        <Box
          onClick={async (e) => {
            e.stopPropagation();
            if (isExpanded) return toggleExpand();

            const blocks = await db.notes.contentBlocks(item.id);
            const linkedBlocks = (await db.notes.internalLinks(noteId)).filter(
              (l) => l.id === item.id
            );
            setBlocks(
              linkedBlocks.length > 0
                ? blocks.filter((a) =>
                    linkedBlocks.some((l) => l.params?.blockId === a.id)
                  )
                : []
            );
            toggleExpand();
          }}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </Box>
        <Text>{item.title}</Text>
      </Button>
      {isExpanded
        ? blocks.map((block) => (
            <Button
              key={block.id}
              variant="menuitem"
              sx={{
                p: 1,
                pl: 4,
                gap: 1,
                width: "100%",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid var(--border)"
              }}
              onClick={() =>
                useEditorStore
                  .getState()
                  .openSession(item, { activeBlockId: block.id })
              }
            >
              <Text
                variant="subBody"
                sx={{
                  bg: "background-secondary",
                  p: "small",
                  flexShrink: 0,
                  px: 1,
                  borderRadius: "default",
                  alignSelf: "flex-start"
                }}
              >
                {block.type.toUpperCase()}
              </Text>
              <Text
                variant="body"
                sx={{
                  fontSize: "subBody",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap"
                }}
              >
                {block.content}
              </Text>
            </Button>
          ))
        : null}
    </>
  );
}

function ReferencedIn({
  item,
  noteId,
  isExpanded,
  toggleExpand
}: {
  item: Note;
  noteId: string;
  toggleExpand: () => void;
  isExpanded: boolean;
}) {
  const [blocks, setBlocks] = useState<
    { id: string; links: [TextSlice, TextSlice, TextSlice][] }[]
  >([]);

  return (
    <>
      <Button
        variant="menuitem"
        sx={{
          p: 1,
          width: "100%",
          textAlign: "left",
          display: "flex",
          justifyContent: "start",
          alignItems: "center",
          borderBottom: isExpanded ? "none" : "1px solid var(--border)"
        }}
        onClick={() => useEditorStore.getState().openSession(item)}
      >
        <Box
          onClick={async (e) => {
            e.stopPropagation();
            if (isExpanded) return toggleExpand();
            const blocks = await db.notes.contentBlocksWithLinks(item.id);
            setBlocks(
              blocks
                .filter((b) =>
                  b.content.includes(createInternalLink("note", noteId))
                )
                .map((block) => ({
                  id: block.id,
                  links: highlightInternalLinks(block, noteId)
                }))
            );
            toggleExpand();
          }}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </Box>
        <Text variant="body">{item.title}</Text>
      </Button>
      {isExpanded
        ? blocks.map((block) => (
            <>
              {block.links.map((link, index) => (
                <Button
                  key={index.toString()}
                  variant="menuitem"
                  sx={{
                    p: 1,
                    pl: 4,
                    pr: 2,
                    gap: 1,
                    width: "100%",
                    textAlign: "left",
                    borderBottom: "1px solid var(--border)"
                  }}
                  onClick={() =>
                    useEditorStore
                      .getState()
                      .openSession(item, { activeBlockId: block.id })
                  }
                >
                  {link.map((slice) => (
                    <Text
                      key={slice.text}
                      variant="body"
                      sx={{
                        color: slice.highlighted
                          ? "accent-selected"
                          : "paragraph",
                        fontWeight: slice.highlighted ? "bold" : "normal",
                        textDecoration: slice.highlighted
                          ? "underline solid var(--accent-selected)"
                          : "none"
                      }}
                    >
                      {slice.text}
                    </Text>
                  ))}
                </Button>
              ))}
            </>
          ))
        : null}
    </>
  );
}

function Colors({ noteId, color }: { noteId: string; color?: string }) {
  const result = usePromise(() => db.colors.all.items(), [color]);
  return (
    <Flex
      py={2}
      px={1}
      sx={{
        cursor: "pointer",
        justifyContent: "start"
      }}
    >
      {result.status === "fulfilled" &&
        result.value.map((c) => {
          const isChecked = c.id === color;
          return (
            <Flex
              key={c.id}
              onClick={() => noteStore.get().setColor(c.id, isChecked, noteId)}
              sx={{
                cursor: "pointer",
                position: "relative",
                alignItems: "center",
                justifyContent: "space-between"
              }}
              data-test-id={`properties-${c.title}`}
            >
              <Circle
                size={35}
                color={c.colorCode}
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
  const result = usePromise(
    () =>
      db.relations
        .to({ id: noteId, type: "note" }, "notebook")
        .selector.sorted(db.settings.getGroupOptions("notebooks")),
    [noteId]
  );

  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section title={strings.notebooks()}>
      <VirtualizedList
        mode="fixed"
        estimatedSize={50}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        renderItem={({ index }) => (
          <ResolvedItem index={index} items={result.value} type="notebook">
            {({ item, data }) => (
              <ListItemWrapper item={item} data={data} compact />
            )}
          </ResolvedItem>
        )}
      />
    </Section>
  );
}

function Reminders({ noteId }: { noteId: string }) {
  const result = usePromise(
    () =>
      db.relations
        .from({ id: noteId, type: "note" }, "reminder")
        .selector.sorted(db.settings.getGroupOptions("reminders")),
    [noteId]
  );
  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section title={strings.dataTypesPluralCamelCase.reminder()}>
      <VirtualizedList
        mode="fixed"
        estimatedSize={54}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        renderItem={({ index }) => (
          <ResolvedItem index={index} items={result.value} type="reminder">
            {({ item, data }) => (
              <ListItemWrapper item={item} data={data} compact />
            )}
          </ResolvedItem>
        )}
      />
    </Section>
  );
}
function Attachments({ noteId }: { noteId: string }) {
  const result = usePromise(
    () =>
      db.attachments
        .ofNote(noteId, "all")
        .sorted({ sortBy: "dateCreated", sortDirection: "desc" }),
    [noteId]
  );
  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section title={strings.dataTypesPluralCamelCase.attachment()}>
      <VirtualizedTable
        estimatedSize={30}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        style={{ tableLayout: "fixed", width: "100%" }}
        header={
          <tr>
            <th style={{ width: "75%" }} />
            <th style={{ width: "5%" }} />
            <th style={{ width: "20%" }} />
          </tr>
        }
        renderRow={({ index }) => (
          <ResolvedItem index={index} type="attachment" items={result.value}>
            {({ item }) => <ListItemWrapper item={item} compact />}
          </ResolvedItem>
        )}
      />
    </Section>
  );
}
function SessionHistory({ noteId }: { noteId: string }) {
  const result = usePromise(
    () =>
      db.noteHistory
        .get(noteId)
        .sorted({ sortBy: "dateModified", sortDirection: "desc" }),
    [noteId]
  );
  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section
      title={strings.noteHistory()}
      subtitle={strings.noteHistoryNotice[0]()}
    >
      <VirtualizedList
        mode="dynamic"
        estimatedSize={28}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        renderItem={({ index }) => (
          <ResolvedItem type="session" index={index} items={result.value}>
            {({ item }) => <SessionItem noteId={noteId} session={item} />}
          </ResolvedItem>
        )}
      />
    </Section>
  );
}

type SectionProps = {
  title: string;
  subtitle?: string;
  button?: JSX.Element;
  buttonPosition?: "left" | "right";
};
export function Section({
  title,
  subtitle,
  button,
  buttonPosition = "left",
  children
}: PropsWithChildren<SectionProps>) {
  return (
    <Flex
      sx={{
        borderRadius: "default",
        flexDirection: "column"
      }}
    >
      <Flex
        mx={1}
        mt={2}
        sx={{
          alignItems: "center",
          justifyContent:
            buttonPosition === "right" ? "space-between" : "flex-start"
        }}
      >
        {buttonPosition === "left" && button}
        <Text variant="subtitle">{title}</Text>
        {buttonPosition === "right" && button}
      </Flex>
      {subtitle && (
        <Text variant="subBody" mb={1} mx={1}>
          {subtitle}
        </Text>
      )}
      {children}
    </Flex>
  );
}

function changeToggleState(
  prop: "lock" | "readonly" | "local-only" | "pin" | "favorite",
  session: ReadonlyEditorSession | DefaultEditorSession
) {
  const { id: sessionId, readonly, localOnly, pinned, favorite } = session.note;
  if (!sessionId) return;
  switch (prop) {
    case "lock":
      return "locked" in session && session.locked
        ? noteStore.unlock(sessionId)
        : noteStore.lock(sessionId);
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
