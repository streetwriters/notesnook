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
import { AnimatedFlex } from "../animated";
import Toggle from "./toggle";
import ScrollContainer from "../scroll-container";
import { getFormattedDate } from "@notesnook/common";
import { ScopedThemeProvider } from "../theme-provider";
import usePromise from "../../hooks/use-promise";
import { ListItemWrapper } from "../list-container/list-profiles";
import { VirtualizedList } from "../virtualized-list";
import { ResolvedItem, useResolvedItem } from "../list-container/resolved-item";
import { SessionItem } from "../session-item";
import { COLORS } from "../../common/constants";
import {
  ContentBlock,
  DefaultColors,
  Note,
  VirtualizedGrouping,
  createInternalLink,
  highlightInternalLinks
} from "@notesnook/core";
import { VirtualizedTable } from "../virtualized-table";
import { TextSlice } from "@notesnook/core/dist/utils/content-block";

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

type MetadataItem<T extends "dateCreated" | "dateEdited"> = {
  key: T;
  label: string;
  value: (value: number) => string;
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
  id: string;
};
function EditorProperties(props: EditorPropertiesProps) {
  const { id } = props;

  const toggleProperties = useEditorStore((store) => store.toggleProperties);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const session = useEditorStore((store) =>
    store.getSession(id, ["default", "unlocked", "readonly"])
  );

  if (isFocusMode || !session) return null;
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
        top: 0,
        right: 0,
        zIndex: 1,
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
            <>
              {tools.map((tool) => (
                <Toggle
                  {...tool}
                  key={tool.key}
                  isOn={!!session.note[tool.property]}
                  onToggle={() => changeToggleState(tool.key, session)}
                  testId={`properties-${tool.key}`}
                />
              ))}
            </>

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
                  {item.value(session.note[item.key])}
                </Text>
              </Flex>
            ))}
            <Colors noteId={id} color={session.color} />
          </Section>
          <InternalLinks noteId={id} />
          <Notebooks noteId={id} />
          <Reminders noteId={id} />
          <Attachments noteId={id} />
          <SessionHistory noteId={id} />
        </ScrollContainer>
      </ScopedThemeProvider>
    </AnimatedFlex>
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
  }, [tabIndex]);

  return (
    <Flex sx={{ flexDirection: "column", mt: 2 }}>
      <Flex
        sx={{
          justifyContent: "stretch",
          borderRadius: "default",
          overflow: "hidden",
          mx: 2,
          mb: 1
        }}
      >
        {["Linked notes", "Referenced in"].map((title, index) => (
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

      {result.status === "fulfilled" && (
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
      )}
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

  if (!item || item.item.type !== "note") return null;

  if (tabIndex === InternalLinksTabs.LINKED_NOTES)
    return (
      <LinkedNote
        item={item.item}
        noteId={noteId}
        isExpanded={isExpanded(item.item.id)}
        toggleExpand={() => toggleExpand(item.item.id)}
      />
    );
  return (
    <ReferencedIn
      item={item.item}
      noteId={noteId}
      isExpanded={isExpanded(item.item.id)}
      toggleExpand={() => toggleExpand(item.item.id)}
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
          alignItems: "center"
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
          alignItems: "center"
        }}
        onClick={() => useEditorStore.getState().openSession(item)}
      >
        <Box
          onClick={async (e) => {
            e.stopPropagation();
            if (isExpanded) return toggleExpand();
            const blocks = await db.notes.contentBlocks(item.id);
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
        <Text>{item.title}</Text>
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
  const result = usePromise(
    async () =>
      (
        await db.relations.to({ id: noteId, type: "note" }, "color").resolve(1)
      ).at(0),
    [color]
  );

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

  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section title="Notebooks">
      <VirtualizedList
        mode="fixed"
        estimatedSize={50}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        renderItem={({ index }) => (
          <ResolvedItem index={index} items={result.value} type="notebook">
            {({ item, data }) => (
              <ListItemWrapper item={item} data={data} simplified />
            )}
          </ResolvedItem>
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
  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section title="Reminders">
      <VirtualizedList
        mode="fixed"
        estimatedSize={54}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        renderItem={({ index }) => (
          <ResolvedItem index={index} items={result.value} type="reminder">
            {({ item, data }) => (
              <ListItemWrapper item={item} data={data} simplified />
            )}
          </ResolvedItem>
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
  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section title="Attachments">
      <VirtualizedTable
        estimatedSize={30}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        header={<></>}
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
  const result = usePromise(() =>
    db.noteHistory
      .get(noteId)
      .sorted({ sortBy: "dateModified", sortDirection: "desc" })
  );
  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section
      title="Previous Sessions"
      subtitle={"Your session history is local only."}
    >
      <VirtualizedList
        mode="fixed"
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

type SectionProps = { title: string; subtitle?: string; button?: JSX.Element };
export function Section({
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
  prop: "lock" | "readonly" | "local-only" | "pin" | "favorite",
  session: ReadonlyEditorSession | DefaultEditorSession
) {
  const {
    id: sessionId,
    locked,
    readonly,
    localOnly,
    pinned,
    favorite
  } = session.note;
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
