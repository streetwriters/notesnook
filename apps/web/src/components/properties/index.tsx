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

import React, { PropsWithChildren, useEffect, useState } from "react";
import {
  Star,
  Lock,
  Circle,
  Checkmark,
  SpellCheck,
  SquaresFour,
  Table,
  LinkHorizontal,
  Copy,
  ClockCounterClockwise,
  Clock,
  PencilSimple,
  Plus,
  Icon,
  Notebook,
  Tag,
  FileDoc,
  FileText,
  CaretDown,
  NotePin,
  BoxArrowDown,
  Cloud,
  Bell,
  Ellipse,
  CloudSlash
} from "../icons";
import { Button, Flex, Text, FlexProps, Box } from "@theme-ui/components";
import { useThemeUI } from "@theme-ui/core";
import {
  useEditorStore,
  ReadonlyEditorSession,
  DefaultEditorSession,
  PropertiesTabId
} from "../../stores/editor-store";
import { db } from "../../common/db";
import { useStore as useAttachmentStore } from "../../stores/attachment-store";
import { store as noteStore } from "../../stores/note-store";
import { store as notebookStore } from "../../stores/notebook-store";
import { store as tagStore } from "../../stores/tag-store";
import Toggle from "./toggle";
import { EditNoteCreationDateDialog } from "../../dialogs/edit-note-creation-date-dialog";
import { CreateColorDialog } from "../../dialogs/create-color-dialog";
import ScrollContainer from "../scroll-container";
import {
  formatDate,
  usePromise,
  ResolvedItem,
  useUnresolvedItem
} from "@notesnook/common";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { ScopedThemeProvider } from "../theme-provider";
import { ListItemWrapper } from "../list-container/list-profiles";
import { copyNoteLink } from "../../common";
import { VirtualizedList } from "../virtualized-list";
import { SessionItem } from "../session-item";
import {
  ContentBlock,
  Note,
  VirtualizedGrouping,
  createInternalLink,
  highlightInternalLinks
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Theme } from "@notesnook/theme";
import { useSpellChecker } from "../../hooks/use-spell-checker";
import { TabItem } from "../navigation-menu/tab-item";
import TableOfContents from "../editor/table-of-contents";
import IconTag from "../icon-tag";
import { navigate } from "../../navigation";
import { store as appStore } from "../../stores/app-store";

const tabs = [
  {
    id: "properties",
    icon: SquaresFour
  },
  {
    id: "toc",
    icon: Table
  },
  {
    id: "note-links",
    icon: LinkHorizontal
  },
  {
    id: "note-history",
    icon: ClockCounterClockwise
  },
  {
    id: "attachments",
    icon: FileDoc
  },
  {
    id: "reminders",
    icon: Bell
  }
] as const satisfies { id: PropertiesTabId; icon: Icon }[];

const tools = [
  { key: "pin", property: "pinned", icon: NotePin, label: strings.pin() },
  {
    key: "favorite",
    property: "favorite",
    icon: Star,
    label: strings.favorite()
  },
  { key: "lock", icon: Lock, label: strings.lock(), property: "locked" },
  {
    key: "readonly",
    icon: PencilSimple,
    label: strings.readOnly(),
    property: "readonly"
  },
  {
    key: "archive",
    icon: BoxArrowDown,
    label: strings.archive(),
    property: "archived"
  },
  {
    key: "local-only",
    icon: CloudSlash,
    label: strings.disableSync(),
    property: "localOnly"
  },
  {
    key: "spellcheck",
    icon: SpellCheck,
    label: strings.spellCheck(),
    property: "spellcheck",
    isHidden: () => IS_DESKTOP_APP && !useSpellChecker.getState().enabled
  }
] as const;

type MetadataItem<T extends "dateCreated" | "dateEdited"> = {
  key: T;
  label: string;
  icon: Icon;
  value: (value: number) => string;
};

type EditorPropertiesProps = {
  sessionId: string;
};
function EditorProperties(props: EditorPropertiesProps) {
  const activeTab = useEditorStore((store) => store.propertiesTab);
  useSpellChecker((store) => store.enabled);
  const session = useEditorStore((store) =>
    store.getSession(props.sessionId, [
      "default",
      "readonly",
      "deleted",
      "diff"
    ])
  );
  if (!session || !activeTab) return null;

  return (
    <Flex
      sx={{
        display: "flex",
        height: "100%",
        width: "100%",
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
          flexDirection: "column",
          py: "spacing4"
        }}
      >
        <Flex sx={{ gap: "spacing2", px: "spacing4" }}>
          {tabs.map((tab) => (
            <TabItem
              key={tab.id}
              icon={tab.icon}
              selected={activeTab === tab.id}
              onClick={() => useEditorStore.getState().setPropertiesTab(tab.id)}
              sx={{ width: "30px", height: "30px" }}
              iconColor="icon-secondary"
            />
          ))}
        </Flex>
        <Box
          sx={{
            height: "1px",
            my: "spacing4",
            bg: "separator",
            mx: "spacing4"
          }}
        />
        {activeTab === "toc" ? (
          <TableOfContents sessionId={session.id} />
        ) : activeTab === "note-links" ? (
          <ScrollContainer>
            <InternalLinks key={session.note.id} noteId={session.note.id} />
          </ScrollContainer>
        ) : activeTab === "note-history" ? (
          <ScrollContainer>
            <SessionHistory noteId={session.note.id} />
          </ScrollContainer>
        ) : activeTab === "attachments" ? (
          <ScrollContainer>
            <Attachments noteId={session.note.id} />
          </ScrollContainer>
        ) : activeTab === "reminders" ? (
          <ScrollContainer>
            <Reminders noteId={session.note.id} />
          </ScrollContainer>
        ) : (
          <ScrollContainer>
            <Properties sessionId={session.id} />
          </ScrollContainer>
        )}
      </ScopedThemeProvider>
    </Flex>
  );
}
export default React.memo(EditorProperties);

function Properties({ sessionId }: EditorPropertiesProps) {
  const dateFormat = useSettingStore((store) => store.dateFormat);
  const timeFormat = useSettingStore((store) => store.timeFormat);
  const metadataItems = [
    {
      key: "dateCreated",
      label: strings.createdAt(),
      icon: Clock,
      value: (date: number) =>
        formatDate(date || Date.now(), {
          type: "date-time",
          dateFormat,
          timeFormat
        })
    } as MetadataItem<"dateCreated">,
    {
      key: "dateEdited",
      label: strings.lastEditedAt(),
      icon: ClockCounterClockwise,
      value: (date: number) =>
        date
          ? formatDate(date, { type: "date-time", dateFormat, timeFormat })
          : "never"
    } as MetadataItem<"dateEdited">
  ];
  const session = useEditorStore((store) =>
    store.getSession(sessionId, ["default", "readonly", "deleted", "diff"])
  );
  if (!session) return null;

  return (
    <Flex
      data-test-id="general-section"
      sx={{ flexDirection: "column", px: "spacing4" }}
    >
      <Section title="Properties">
        <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
          {session.type === "deleted" || session.type === "diff" ? null : (
            <>
              {tools.map((tool) =>
                "isHidden" in tool && tool.isHidden() ? null : (
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
                )
              )}
              <Flex
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "spacing4",
                  borderRadius: "radius2",
                  cursor: "pointer"
                }}
                data-test-id="properties-copy-link"
              >
                <Flex
                  sx={{
                    alignItems: "center",
                    minWidth: 0,
                    gap: "spacing4"
                  }}
                >
                  <Flex
                    sx={{
                      alignItems: "center",
                      justifyContent: "center",
                      width: 24,
                      height: 24,
                      flexShrink: 0,
                      borderRadius: "radius1",
                      bg: "background-tertiary"
                    }}
                  >
                    <LinkHorizontal size={15} />
                  </Flex>
                  <Text
                    sx={{
                      color: "heading",
                      fontSize: "xs",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Copy note link
                  </Text>
                </Flex>
                <CopyNoteLink note={session.note} />
              </Flex>
            </>
          )}
        </Flex>
      </Section>
      <Section
        title="Metadata"
        sx={{
          borderTop: "1px solid var(--separator)",
          mt: "spacing4",
          pt: "spacing4"
        }}
      >
        <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
          {metadataItems.map((item) => {
            const MetadataIcon = item.icon;

            return (
              <Flex
                key={item.key}
                sx={{
                  alignItems: "center",
                  gap: "spacing4",
                  borderRadius: "radius2"
                }}
              >
                <Flex
                  sx={{
                    alignSelf: "flex-start",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    flexShrink: 0,
                    borderRadius: "radius1",
                    bg: "background-tertiary"
                  }}
                >
                  <MetadataIcon size={15} />
                </Flex>
                <Flex
                  sx={{
                    alignItems: "flex-start",
                    flexDirection: "column",
                    flex: 1,
                    minWidth: 0,
                    gap: "spacing3"
                  }}
                >
                  <Text
                    sx={{
                      color: "heading",
                      fontSize: "xs",
                      lineHeight: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    data-test-id={
                      item.key === "dateCreated" ? "date-created" : undefined
                    }
                    className="selectable"
                    sx={{
                      color: "paragraph",
                      fontSize: "3xs",
                      lineHeight: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {item.value(session.note[item.key])}
                  </Text>
                </Flex>
                {item.key === "dateCreated" && (
                  <PencilSimple
                    size={15}
                    sx={{ cursor: "pointer", color: "icon", flexShrink: 0 }}
                    onClick={() => {
                      EditNoteCreationDateDialog.show({
                        noteId: session.note.id,
                        dateCreated: session.note.dateCreated,
                        dateEdited: session.note.dateEdited
                      });
                    }}
                    data-test-id="edit-date-created"
                  />
                )}
              </Flex>
            );
          })}
        </Flex>
      </Section>
      {session.type === "deleted" || session.type === "diff" ? null : (
        <>
          <Section
            title="Colors"
            sx={{
              borderTop: "1px solid var(--separator)",
              mt: "spacing4",
              pt: "spacing4"
            }}
          >
            <Colors noteId={session.note.id} color={session.color} />
          </Section>
        </>
      )}
      {session.type === "deleted" || session.type === "diff" ? null : (
        <>
          <Tags noteId={session.note.id} />
          <Notebooks noteId={session.note.id} />
        </>
      )}
    </Flex>
  );
}

function CopyNoteLink({ note }: { note: Note }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <Button
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "spacing2",
        flexShrink: 0,
        color: "accent",
        p: 0,
        ":hover": {
          bg: "transparent !important"
        }
      }}
      onClick={async () => {
        await copyNoteLink(note);
        setCopied(true);
      }}
    >
      <Copy size={12} color="accent" />
      <Text sx={{ color: "accent", fontSize: "3xs", fontWeight: 500 }}>
        {copied ? "Copied!" : "Copy"}
      </Text>
    </Button>
  );
}

function InternalLinks({ noteId }: { noteId: string }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const { theme } = useThemeUI();
  const itemGap = (theme as Theme).space?.spacing1;
  const linkedNotes = usePromise(() => {
    return db.relations
      .from({ id: noteId, type: "note" }, "note")
      .selector.fields(["notes.id", "notes.title"])
      .sorted(db.settings.getGroupOptions("notes"));
  }, [noteId]);
  const referencedIn = usePromise(() => {
    return db.relations
      .to({ id: noteId, type: "note" }, "note")
      .selector.fields(["notes.id", "notes.title"])
      .sorted(db.settings.getGroupOptions("notes"));
  }, [noteId]);

  const toggleExpand = (key: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });

  const renderList = (
    section: "linked" | "referenced",
    result: typeof linkedNotes,
    emptyText: string
  ) => {
    if (result.status !== "fulfilled") return null;
    if (result.value.length === 0) {
      return (
        <Text
          sx={{
            color: "paragraph-secondary",
            fontSize: "xs",
            lineHeight: "100%"
          }}
        >
          {emptyText}
        </Text>
      );
    }

    return (
      <VirtualizedList
        mode="dynamic"
        estimatedSize={27}
        itemGap={itemGap}
        getItemKey={(index) => result.value.key(index)}
        items={result.value.placeholders}
        context={{
          items: result.value,
          noteId,
          section,
          isExpanded: (id) => expandedIds.has(`${section}:${id}`),
          toggleExpand: (id) => toggleExpand(`${section}:${id}`)
        }}
        renderItem={InternalLinkItem}
      />
    );
  };

  return (
    <Flex sx={{ flexDirection: "column", gap: "spacing4", px: "spacing4" }}>
      <Section
        title={strings.linkedNotes()}
        headerAction={
          linkedNotes.status === "fulfilled" && linkedNotes.value.length > 0 ? (
            <Text
              sx={{
                fontSize: "3xs",
                color: "heading-secondary",
                fontWeight: 500,
                lineHeight: "100%",
                letterSpacing: "0.33px"
              }}
            >
              {linkedNotes.value.length}
            </Text>
          ) : undefined
        }
      >
        {renderList("linked", linkedNotes, strings.notLinked())}
      </Section>
      {linkedNotes.status === "fulfilled" && linkedNotes.value.length === 0 && (
        <Box sx={{ height: "1px", width: "100%", bg: "separator" }} />
      )}
      <Section
        title={strings.referencedIn()}
        headerAction={
          referencedIn.status === "fulfilled" &&
          referencedIn.value.length > 0 ? (
            <Text
              sx={{
                fontSize: "3xs",
                color: "heading-secondary",
                fontWeight: 500,
                lineHeight: "100%",
                letterSpacing: "0.33px"
              }}
            >
              {referencedIn.value.length}
            </Text>
          ) : undefined
        }
      >
        {referencedIn.status === "fulfilled" &&
          referencedIn.value.length > 0 && (
            <Box
              sx={{
                height: "1px",
                width: "100%",
                bg: "separator",
                mb: "spacing4"
              }}
            />
          )}
        {renderList("referenced", referencedIn, strings.notReferenced())}
      </Section>
    </Flex>
  );
}

type InternalLinkItemContext = {
  items: VirtualizedGrouping<Note>;
  noteId: string;
  section: "linked" | "referenced";
  isExpanded: (id: string) => boolean;
  toggleExpand: (id: string) => void;
};

function InternalLinkItem({
  index,
  context
}: {
  item: boolean;
  index: number;
  context: InternalLinkItemContext;
}) {
  const { items, noteId, section, isExpanded, toggleExpand } = context;
  const item = useUnresolvedItem({ items, index, type: "note" });

  if (!item) return null;

  return section === "linked" ? (
    <LinkedNote
      item={item.item}
      noteId={noteId}
      isExpanded={isExpanded(item.item.id)}
      toggleExpand={() => toggleExpand(item.item!.id)}
    />
  ) : (
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
        (l) => l.id === item.id && l.type === "note" && !!l.params?.blockId
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
            p: "spacing2",
            borderRadius: "radius1",
            textAlign: "left",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            gap: "spacing3",
            bg: isExpanded ? "background-selected" : "transparent"
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
                    linkedBlocks.value.some(
                      (l) => l.type === "note" && l.params?.blockId === a.id
                    )
                  )
                );
                toggleExpand();
              }}
            >
              <CaretDown
                size={11}
                sx={{ transform: isExpanded ? undefined : "rotate(-90deg)" }}
                color={isExpanded ? "icon-selected" : "icon"}
              />
            </Button>
          ) : (
            <FileText size={13} color="paragraph-primary" />
          )}
          <Text
            sx={{
              fontSize: "xs",
              color: isExpanded ? "paragraph-selected" : "paragraph-primary"
            }}
          >
            {item.title}
          </Text>
        </Button>
      </Flex>
      {isExpanded
        ? blocks.map((block) => (
            <Flex key={block.id} sx={{ width: "100%", alignItems: "center" }}>
              <Button
                variant="menuitem"
                sx={{
                  flex: 1,
                  borderRadius: "radius1",
                  px: "spacing2",
                  py: "spacing3",
                  pl: "spacing7",
                  mt: "spacing1",
                  gap: "spacing3",
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
                  sx={{
                    color: "paragraph",
                    fontSize: "3xs",
                    bg: "background-tertiary",
                    flexShrink: 0,
                    py: "spacing1",
                    px: "spacing2",
                    borderRadius: "radius1",
                    lineHeight: "100%"
                  }}
                >
                  {block.type.toUpperCase()}
                </Text>
                <Text
                  sx={{
                    color: "paragraph",
                    fontSize: "xs",
                    lineHeight: "100%",
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
  const referencedBlocks = usePromise(async () => {
    const blocks = await db.notes.contentBlocksWithLinks(item.id);
    return blocks
      .filter((b) => b.content.includes(createInternalLink("note", noteId)))
      .map((block) => ({
        id: block.id,
        links: highlightInternalLinks(block, noteId)
      }));
  }, [item.id, noteId]);
  const blocks =
    referencedBlocks.status === "fulfilled" ? referencedBlocks.value : [];

  return (
    <>
      <Flex sx={{ width: "100%", alignItems: "center" }}>
        <Button
          variant="menuitem"
          sx={{
            flex: 1,
            p: "spacing2",
            borderRadius: "radius1",
            textAlign: "left",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            gap: "spacing3",
            bg: isExpanded ? "background-selected" : "transparent"
          }}
          onClick={() => useEditorStore.getState().openSession(item)}
        >
          <Button
            variant="secondary"
            sx={{ bg: "transparent", p: 0, borderRadius: 100 }}
            onClick={(e) => {
              e.stopPropagation();
              if (isExpanded) return toggleExpand();
              toggleExpand();
            }}
          >
            <CaretDown
              size={11}
              sx={{ transform: isExpanded ? undefined : "rotate(-90deg)" }}
            />
          </Button>
          <Text
            sx={{
              fontSize: "xs",
              color: isExpanded ? "paragraph-selected" : "paragraph-primary"
            }}
          >
            {item.title}
          </Text>
          {/* {blocks.length > 0 && (
            <Text
              variant="subBody"
              sx={{ ml: "auto", color: "paragraph-secondary" }}
            >
              {blocks.length}
            </Text>
          )} */}
        </Button>
      </Flex>
      {isExpanded
        ? blocks.map((block, blockIndex) => (
            <>
              {block.links.map((link, index) => (
                <Button
                  key={index.toString()}
                  variant="menuitem"
                  sx={{
                    flex: 1,
                    borderRadius: "radius1",
                    px: "spacing7",
                    py: "spacing3",
                    mt: "spacing1",
                    textAlign: "left",
                    whiteSpace: "pre-wrap",
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "row",
                    gap: "spacing3",
                    width: "100%",
                    fontSize: "xs"
                  }}
                  onClick={() =>
                    useEditorStore
                      .getState()
                      .openSession(item, { activeBlockId: block.id })
                  }
                >
                  <Text sx={{ color: "accent" }}>{blockIndex + 1}.</Text>
                  <Text as="div" sx={{ color: "accent" }}>
                    {link.map((slice) =>
                      slice.highlighted ? (
                        <Text
                          key={slice.text}
                          as="span"
                          sx={{
                            color: "accent",
                            textDecoration: "underline solid var(--accent)"
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
  const addColor = () => {
    CreateColorDialog.show({}).then((colorId) => {
      if (colorId) noteStore.get().setColor(colorId, false, noteId);
    });
  };

  return (
    <Flex
      sx={{
        alignItems: "center",
        flexWrap: "wrap",
        gap: 0
      }}
    >
      <Button
        aria-label="Add color"
        onClick={addColor}
        variant="secondary"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 25,
          height: 25,
          minHeight: 25,
          flexShrink: 0,
          p: 0,
          cursor: "pointer",
          borderRadius: "radius5",
          bg: "background-tertiary",
          color: "paragraph",
          zIndex: result.status === "fulfilled" ? result.value.length + 1 : 1
        }}
        data-test-id="properties-add-color"
      >
        <Plus size={12} />
      </Button>
      {result.status === "fulfilled" &&
        result.value.map((c, index) => {
          const isChecked = c.id === color;
          return (
            <Flex
              key={c.id}
              title={c.title}
              onClick={() => noteStore.get().setColor(c.id, isChecked, noteId)}
              sx={{
                cursor: "pointer",
                position: "relative",
                alignItems: "center",
                justifyContent: "center",
                width: 25,
                height: 25,
                flexShrink: 0,
                ml: "-8px",
                zIndex: result.value.length - index
              }}
              data-test-id={`properties-${c.title}`}
            >
              <Ellipse
                size={25}
                color={c.colorCode}
                data-test-id={`toggle-state-${isChecked ? "on" : "off"}`}
              />
              {isChecked && (
                <Checkmark
                  color="paragraph"
                  size={12}
                  sx={{ position: "absolute" }}
                />
              )}
            </Flex>
          );
        })}
    </Flex>
  );
}

function Tags({ noteId }: { noteId: string }) {
  const result = usePromise(
    async () =>
      await db.relations
        .to({ id: noteId, type: "note" }, "tag")
        .selector.sorted(db.settings.getGroupOptions("tags")),
    [noteId]
  );

  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section
      title={strings.dataTypesPluralCamelCase.tag()}
      sx={{
        borderTop: "1px solid var(--separator)",
        mt: "spacing4",
        pt: "spacing4"
      }}
    >
      <Flex sx={{ flexWrap: "wrap", gap: "spacing3" }}>
        {result.value.placeholders.map((_, index) => (
          <ResolvedItem
            key={result.value.key(index)}
            index={index}
            items={result.value}
            type="tag"
          >
            {({ item }) => (
              <IconTag
                icon={Tag}
                iconSize={11}
                text={item.title}
                onClick={() => {
                  appStore.get().setNavigationTab("tags");
                  navigate(`/tags/${item.id}`);
                }}
                onDismiss={async () => {
                  await db.relations.unlink(item, { id: noteId, type: "note" });
                  await tagStore.get().refresh();
                  await noteStore.get().refresh();
                  result.refresh();
                }}
                styles={{
                  container: {
                    bg: "background-tertiary",
                    px: "spacing3",
                    py: "spacing2",
                    ":hover": { bg: "hover" }
                  }
                }}
              />
            )}
          </ResolvedItem>
        ))}
      </Flex>
    </Section>
  );
}

function Notebooks({ noteId }: { noteId: string }) {
  const result = usePromise(
    async () =>
      await db.relations
        .to({ id: noteId, type: "note" }, "notebook")
        .selector.sorted(db.settings.getGroupOptions("notebooks")),
    [noteId]
  );

  if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section
      title={strings.notebooks()}
      sx={{
        borderTop: "1px solid var(--separator)",
        mt: "spacing4",
        pt: "spacing4"
      }}
    >
      <Flex sx={{ flexWrap: "wrap", gap: "spacing3" }}>
        {result.value.placeholders.map((_, index) => (
          <ResolvedItem
            key={result.value.key(index)}
            index={index}
            items={result.value}
            type="notebook"
          >
            {({ item }) => (
              <IconTag
                icon={Notebook}
                iconSize={11}
                text={item.title}
                onClick={() => {
                  appStore.get().setNavigationTab("notebooks");
                  navigate(`/notebooks/${item.id}`);
                }}
                onDismiss={async () => {
                  await db.relations.unlink(item, { id: noteId, type: "note" });
                  await notebookStore.get().refresh();
                  await noteStore.get().refresh();
                  result.refresh();
                }}
                styles={{
                  container: {
                    bg: "background-tertiary",
                    px: "spacing3",
                    py: "spacing2",
                    ":hover": { bg: "hover" }
                  }
                }}
              />
            )}
          </ResolvedItem>
        ))}
      </Flex>
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
      title={strings.dataTypesPluralCamelCase.reminder()}
      sx={{ px: "spacing4" }}
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
  const { theme } = useThemeUI();
  const itemGap = (theme as Theme).space?.spacing1;
  const nonce = useAttachmentStore((store) => store.nonce);
  const result = usePromise(
    () =>
      db.attachments
        .ofNote(noteId, "all")
        .sorted({ sortBy: "dateCreated", sortDirection: "desc" }),
    [noteId, nonce]
  );

  // if (result.status !== "fulfilled" || result.value.length <= 0) return null;

  return (
    <Section
      title={strings.dataTypesPluralCamelCase.attachment()}
      sx={{ px: "spacing4" }}
    >
      {result.status !== "fulfilled" || result.value.length <= 0 ? (
        <Text
          sx={{
            color: "paragraph-secondary",
            fontSize: "xs",
            lineHeight: "100%"
          }}
        >
          No attached files here.
        </Text>
      ) : (
        <VirtualizedList
          mode="fixed"
          estimatedSize={23}
          itemGap={itemGap}
          getItemKey={(index) => result.value.key(index)}
          items={result.value.placeholders}
          renderItem={({ index }) => (
            <ResolvedItem index={index} type="attachment" items={result.value}>
              {({ item }) => <ListItemWrapper item={item} compact />}
            </ResolvedItem>
          )}
        />
      )}
    </Section>
  );
}
function SessionHistory({ noteId }: { noteId: string }) {
  const { theme } = useThemeUI();
  const itemGap = (theme as Theme).space?.spacing1;
  const result = usePromise(
    () =>
      db.noteHistory
        .get(noteId)
        .sorted({ sortBy: "dateModified", sortDirection: "desc" }),
    [noteId]
  );

  return (
    <Section
      sx={{
        px: "spacing4"
      }}
      title={strings.noteHistory()}
      headerAction={
        <Text
          sx={{
            px: "spacing2",
            py: "spacing1",
            borderRadius: "radius1",
            bg: "background-tertiary",
            color: "heading",
            fontSize: "3xs",
            lineHeight: 1
          }}
        >
          Local only
        </Text>
      }
    >
      {result.status !== "fulfilled" || result.value.length <= 0 ? (
        <Text
          sx={{
            color: "paragraph-secondary",
            fontSize: "xs",
            lineHeight: "100%"
          }}
        >
          No history items.
        </Text>
      ) : (
        <VirtualizedList
          mode="dynamic"
          estimatedSize={28}
          itemGap={itemGap}
          getItemKey={(index) => result.value.key(index)}
          items={result.value.placeholders}
          renderItem={({ index }) => (
            <ResolvedItem type="session" index={index} items={result.value}>
              {({ item }) => <SessionItem noteId={noteId} session={item} />}
            </ResolvedItem>
          )}
        />
      )}
    </Section>
  );
}

type SectionProps = {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
} & FlexProps;
export function Section({
  title,
  subtitle,
  headerAction,
  children,
  sx,
  ...otherProps
}: PropsWithChildren<SectionProps>) {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        ...sx
      }}
      {...otherProps}
    >
      {title || subtitle || headerAction ? (
        <Flex
          sx={{
            ...(headerAction
              ? {
                  alignItems: "center",
                  justifyContent: "space-between"
                }
              : { flexDirection: "column" }),
            pb: "spacing4"
          }}
        >
          <Flex sx={{ flexDirection: "column" }}>
            {title && (
              <Text
                sx={{
                  fontSize: "3xs",
                  color: "heading-secondary",
                  fontWeight: 500,
                  letterSpacing: "0.33px",
                  lineHeight: 1
                }}
              >
                {title.toUpperCase()}
              </Text>
            )}
            {subtitle && <Text variant="subBody">{subtitle}</Text>}
          </Flex>
          {headerAction}
        </Flex>
      ) : null}
      {children}
    </Flex>
  );
}

function changeToggleState(
  prop:
    | "lock"
    | "readonly"
    | "local-only"
    | "pin"
    | "favorite"
    | "archive"
    | "spellcheck",
  session: ReadonlyEditorSession | DefaultEditorSession
) {
  const {
    id: sessionId,
    readonly,
    localOnly,
    pinned,
    favorite,
    archived,
    spellcheck
  } = session.note;
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
    case "archive":
      return noteStore.archive(!archived, sessionId);
    case "spellcheck":
      return noteStore.spellcheck(!spellcheck, sessionId);
    default:
      return;
  }
}
