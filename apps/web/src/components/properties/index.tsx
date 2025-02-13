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
  ChevronRight,
  LinkedTo,
  ReferencedIn as ReferencedInIcon,
  Note as NoteIcon
} from "../icons";
import { Box, Button, Flex, Text, FlexProps } from "@theme-ui/components";
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
  useResolvedItem,
  useUnresolvedItem
} from "@notesnook/common";
import { ScopedThemeProvider } from "../theme-provider";
import { ListItemWrapper } from "../list-container/list-profiles";
import { VirtualizedList } from "../virtualized-list";
import { SessionItem } from "../session-item";
import {
  ContentBlock,
  InternalLink,
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
        // top: TITLE_BAR_HEIGHT,
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
          {/* <Flex
            sx={{
              alignItems: "center",
              gap: 1
            }}
          >
            <ArrowLeft
              data-test-id="properties-close"
              onClick={() => toggleProperties(false)}
              size={18}
              sx={{ cursor: "pointer" }}
            />
            <Text variant="subtitle">{strings.properties()}</Text>
          </Flex> */}
          <Flex
            data-test-id="general-section"
            sx={{ flexDirection: "column", gap: 1 }}
          >
            <Section title="Properties">
              <Flex sx={{ flexDirection: "column", gap: 1, px: 2, pt: 1 }}>
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
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: "small"
                    }}
                  >
                    <Text
                      variant="body"
                      sx={{
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
              </Flex>
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
          </Flex>
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
    return links.selector
      .fields(["notes.id", "notes.title"])
      .sorted(db.settings.getGroupOptions("notes"));
  }, [tabIndex, noteId]);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex
        sx={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          py: 1,
          px: 2,
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1
        }}
      >
        <Flex
          sx={{
            gap: 1
          }}
        >
          {[LinkedTo, ReferencedInIcon].map((Icon, index) => (
            <Button
              key={index.toString()}
              variant="secondary"
              sx={{
                p: 1,
                color: tabIndex === index ? "accent-selected" : "paragraph",
                bg: tabIndex === index ? "background-selected" : "transparent"
              }}
              onClick={() => {
                setTabIndex(index);
                setExpandedId(undefined);
              }}
            >
              <Icon
                size={16}
                color={tabIndex === index ? "icon-selected" : "icon"}
              />
            </Button>
          ))}
        </Flex>
        <Text variant="body" color="paragraph-secondary">
          ({result.status === "fulfilled" ? result.value.length : 0}){" "}
          {tabIndex === InternalLinksTabs.LINKED_NOTES
            ? strings.linkedNotes()
            : strings.referencedIn()}{" "}
        </Text>
      </Flex>

      {result.status === "fulfilled" &&
        (result.value.length === 0 ? (
          <Text variant="body" mx={2}>
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
  const item = useUnresolvedItem({ items, index, type: "note" });

  if (!item) return null;

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
  const linkedBlocks = usePromise(
    async () =>
      (await db.notes.internalLinks(noteId)).filter(
        (l) => l.id === item.id && !!l.params?.blockId
      ),
    [item.id]
  );

  return (
    <>
      <Flex sx={{ width: "100%", alignItems: "center" }}>
        <Button
          variant="menuitem"
          sx={{
            flex: 1,
            p: 1,
            mx: 2,
            borderRadius: "default",
            textAlign: "left",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            gap: "small"
            //  borderBottom: isExpanded ? "none" : "1px solid var(--border)"
          }}
          onClick={() => useEditorStore.getState().openSession(item)}
        >
          {linkedBlocks.status === "fulfilled" &&
          linkedBlocks.value.length > 0 ? (
            <Button
              variant="secondary"
              sx={{ bg: "transparent", p: 0, borderRadius: 100 }}
              onClick={async (e) => {
                e.stopPropagation();
                if (isExpanded) return toggleExpand();
                setBlocks(
                  (await db.notes.contentBlocks(item.id)).filter((a) =>
                    linkedBlocks.value.some((l) => l.params?.blockId === a.id)
                  )
                );
                toggleExpand();
              }}
            >
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </Button>
          ) : (
            <NoteIcon size={14} />
          )}
          <Text>{item.title}</Text>
        </Button>
      </Flex>
      {isExpanded
        ? blocks.map((block) => (
            <Flex key={block.id} sx={{ width: "100%", alignItems: "center" }}>
              <Button
                variant="menuitem"
                sx={{
                  flex: 1,
                  borderRadius: "default",
                  p: 1,
                  mx: 2,
                  pl: 4,
                  gap: 1,
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center"
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
            </Flex>
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
      <Flex sx={{ width: "100%", alignItems: "center" }}>
        <Button
          variant="menuitem"
          sx={{
            flex: 1,
            p: 1,
            mx: 2,
            borderRadius: "default",
            textAlign: "left",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            gap: "small"
          }}
          onClick={() => useEditorStore.getState().openSession(item)}
        >
          <Button
            variant="secondary"
            sx={{ bg: "transparent", p: 0, borderRadius: 100 }}
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
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </Button>
          <Text variant="body">{item.title}</Text>
        </Button>
      </Flex>
      {isExpanded
        ? blocks.map((block) => (
            <>
              {block.links.map((link, index) => (
                <Button
                  key={index.toString()}
                  variant="menuitem"
                  sx={{
                    flex: 1,
                    borderRadius: "default",
                    p: 1,
                    mx: 2,
                    pl: 4,
                    textAlign: "left",
                    whiteSpace: "pre-wrap",
                    display: "flex",
                    flexDirection: "row",
                    gap: 2
                  }}
                  onClick={() =>
                    useEditorStore
                      .getState()
                      .openSession(item, { activeBlockId: block.id })
                  }
                >
                  <Text variant="subBody">{index + 1}.</Text>
                  <Text as="div" variant="body">
                    {link.map((slice) =>
                      slice.highlighted ? (
                        <Text
                          key={slice.text}
                          as="span"
                          sx={{
                            color: "accent-selected",
                            fontWeight: "bold",
                            textDecoration:
                              "underline solid var(--accent-selected)"
                          }}
                        >
                          {slice.text}
                        </Text>
                      ) : (
                        <>{slice.text}</>
                      )
                    )}
                  </Text>
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
      sx={{
        cursor: "pointer",
        justifyContent: "start",
        gap: "small"
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
                size={25}
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
    <Section
      title={strings.notebooks()}
      sx={{ borderTop: "1px solid var(--border)" }}
    >
      <VirtualizedList
        style={{ marginTop: 5 }}
        mode="fixed"
        estimatedSize={25}
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
    <Section
      sx={{ borderTop: "1px solid var(--border)" }}
      title={strings.dataTypesPluralCamelCase.reminder()}
    >
      <VirtualizedList
        mode="fixed"
        style={{ marginTop: 5, marginLeft: 10, marginRight: 10 }}
        estimatedSize={48}
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
    <Section
      title={strings.dataTypesPluralCamelCase.attachment()}
      sx={{ borderTop: "1px solid var(--border)" }}
    >
      <VirtualizedTable
        estimatedSize={25}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        style={{
          marginTop: 5,
          tableLayout: "fixed",
          width: "100%"
        }}
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
      sx={{
        borderTop: "1px solid var(--border)"
      }}
      title={strings.noteHistory()}
      subtitle={strings.noteHistoryNotice[0]()}
    >
      <VirtualizedList
        mode="dynamic"
        estimatedSize={28}
        style={{ marginLeft: 10, marginRight: 10, marginTop: 5 }}
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
  title?: string;
  subtitle?: string;
} & FlexProps;
export function Section({
  title,
  subtitle,
  children,
  sx,
  ...otherProps
}: PropsWithChildren<SectionProps>) {
  return (
    <Flex
      sx={{
        // borderRadius: "default",
        flexDirection: "column",
        // bg: "background-secondary",
        // border: "1px solid var(--border)",
        ...sx
      }}
      {...otherProps}
    >
      {title || subtitle ? (
        <Flex
          sx={{
            flexDirection: "column",
            borderBottom: "1px solid var(--border)",
            p: 2
          }}
        >
          {title && (
            <Text variant="subBody" sx={{ fontWeight: "medium" }}>
              {title.toUpperCase()}
            </Text>
          )}
          {subtitle && <Text variant="subBody">{subtitle}</Text>}
        </Flex>
      ) : null}
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
