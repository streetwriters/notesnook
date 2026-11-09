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
  memo,
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactNode
} from "react";
import {
  formatDate,
  ResolvedItem,
  usePromise,
  useUnresolvedItem
} from "@notesnook/common";
import {
  createInternalLink,
  highlightInternalLinks,
  type ContentBlock,
  type Note,
  type VirtualizedGrouping
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Box, Button, dataColor, Flex, Text, type SxProp } from "@ui";
import {
  Bell,
  BoxArrowDown,
  CaretDown,
  Checkmark,
  Clock,
  ClockCounterClockwise,
  CloudSlash,
  Copy,
  Ellipse,
  FileDoc,
  FileText,
  LinkHorizontal,
  Lock,
  Notebook,
  NotePin,
  NoteReadonly,
  PencilSimple,
  Plus,
  SpellCheck,
  SquaresFour,
  Star,
  Table,
  Tag,
  type Icon
} from "../icons";
import {
  useEditorStore,
  type DefaultEditorSession,
  type PropertiesTabId,
  type ReadonlyEditorSession
} from "../../stores/editor-store";
import { db } from "../../common/db";
import { useStore as useAttachmentStore } from "../../stores/attachment-store";
import { useStore as useReminderStore } from "../../stores/reminder-store";
import { store as noteStore } from "../../stores/note-store";
import { store as notebookStore } from "../../stores/notebook-store";
import { store as tagStore } from "../../stores/tag-store";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { store as appStore } from "../../stores/app-store";
import Toggle from "./toggle";
import { EditNoteCreationDateDialog } from "../../dialogs/edit-note-creation-date-dialog";
import { CreateColorDialog } from "../../dialogs/create-color-dialog";
import { AddReminderDialog } from "../../dialogs/add-reminder-dialog";
import ScrollContainer from "../scroll-container";
import { ScopedThemeProvider } from "../theme-provider";
import { ListItemWrapper } from "../list-container/list-profiles";
import ListContainer from "../list-container";
import { VirtualizedList } from "../virtualized-list";
import { SessionItem } from "../session-item";
import { TabItem } from "../navigation-menu/tab-item";
import IconTag from "../icon-tag";
import { ListLoader } from "../loaders/list-loader";
import { copyNoteLink } from "../../common";
import { useSpellChecker } from "../../hooks/use-spell-checker";
import { navigate } from "../../navigation";
import TableOfContents from "../editor/table-of-contents";

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
    icon: NoteReadonly,
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
    isHidden: () => !useSpellChecker.getState().enabled
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
          bg: "background",
          overflow: "hidden",
          flexDirection: "column",
          py: "spacing4"
        }}
      >
        <Flex sx={{ gap: "spacing2", px: "spacing4", flexShrink: 0 }}>
          {tabs.map((tab) => (
            <TabItem
              key={tab.id}
              testID={`properties-tab-${tab.id}`}
              icon={tab.icon}
              size={30}
              iconColor="icon-secondary"
              selected={activeTab === tab.id}
              onPress={() => useEditorStore.getState().setPropertiesTab(tab.id)}
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
          <Reminders noteId={session.note.id} />
        ) : (
          <ScrollContainer>
            <Properties sessionId={session.id} />
          </ScrollContainer>
        )}
      </ScopedThemeProvider>
    </Flex>
  );
}
export default memo(EditorProperties);

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
      testID="general-section"
      sx={{ flexDirection: "column", px: "spacing4" }}
    >
      <Section title={strings.properties()}>
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
                testID="properties-copy-link"
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
                    {strings.copyNoteLink()}
                  </Text>
                </Flex>
                <CopyNoteLink note={session.note} />
              </Flex>
            </>
          )}
        </Flex>
      </Section>
      <Section
        title={strings.metadata()}
        sx={{
          borderTop: "1px solid",
          borderTopColor: "separator",
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
                    testID={
                      item.key === "dateCreated" ? "date-created" : undefined
                    }
                    selectable
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
                    onPress={() => {
                      EditNoteCreationDateDialog.show({
                        noteId: session.note.id,
                        dateCreated: session.note.dateCreated,
                        dateEdited: session.note.dateEdited
                      });
                    }}
                    testID="edit-date-created"
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
            title={strings.colors()}
            sx={{
              borderTop: "1px solid",
              borderTopColor: "separator",
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
        alignItems: "center",
        gap: "spacing2",
        flexShrink: 0,
        color: "accent",
        p: 0,
        ":hover": {
          bg: "transparent"
        }
      }}
      onPress={async () => {
        await copyNoteLink(note);
        setCopied(true);
      }}
    >
      <Copy size={12} color="accent" />
      <Text sx={{ color: "accent", fontSize: "3xs", fontWeight: 500 }}>
        {copied ? strings.copied() : strings.copy()}
      </Text>
    </Button>
  );
}

function InternalLinks({ noteId }: { noteId: string }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const itemGap = 3;
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
            lineHeight: 1
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
                lineHeight: 1,
                letterSpacing: 0.33
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
                lineHeight: 1,
                letterSpacing: 0.33
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
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "spacing3",
            bg: isExpanded ? "background-selected" : "transparent"
          }}
          onPress={() => useEditorStore.getState().openSession(item)}
        >
          {linkedBlocks.status === "fulfilled" &&
          linkedBlocks.value.length > 0 ? (
            <Button
              variant="secondary"
              sx={{ bg: "transparent", p: 0, borderRadius: 100 }}
              onPress={async (e) => {
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
                sx={{}}
                color={isExpanded ? "icon-selected" : "icon"}
              />
            </Button>
          ) : (
            <FileText size={13} color="paragraph" />
          )}
          <Text
            sx={{
              fontSize: "xs",
              color: isExpanded ? "paragraph-selected" : "paragraph"
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
                  alignItems: "center"
                }}
                onPress={() =>
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
                    lineHeight: 1
                  }}
                >
                  {block.type.toUpperCase()}
                </Text>
                <Text
                  sx={{
                    color: "paragraph",
                    fontSize: "xs",
                    lineHeight: 1,
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
            justifyContent: "flex-start",
            alignItems: "center",
            gap: "spacing3",
            bg: isExpanded ? "background-selected" : "transparent"
          }}
          onPress={() => useEditorStore.getState().openSession(item)}
        >
          <Button
            variant="secondary"
            sx={{ bg: "transparent", p: 0, borderRadius: 100 }}
            onPress={(e) => {
              e.stopPropagation();
              if (isExpanded) return toggleExpand();
              toggleExpand();
            }}
          >
            <CaretDown size={11} sx={{}} />
          </Button>
          <Text
            sx={{
              fontSize: "xs",
              color: isExpanded ? "paragraph-selected" : "paragraph"
            }}
          >
            {item.title}
          </Text>
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
                    alignItems: "center",
                    flexDirection: "row",
                    gap: "spacing3",
                    width: "100%",
                    fontSize: "xs"
                  }}
                  onPress={() =>
                    useEditorStore
                      .getState()
                      .openSession(item, { activeBlockId: block.id })
                  }
                >
                  <Text sx={{ color: "accent" }}>{blockIndex + 1}.</Text>
                  <Text sx={{ color: "accent" }}>
                    {link.map((slice) =>
                      slice.highlighted ? (
                        <Text
                          key={slice.text}
                          sx={{
                            color: "accent",
                            textDecorationLine: "underline"
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
        aria-label={strings.addColor()}
        onPress={addColor}
        variant="secondary"
        sx={{
          alignItems: "center",
          justifyContent: "center",
          width: 25,
          height: 25,
          minHeight: 25,
          flexShrink: 0,
          p: 0,
          cursor: "pointer",
          borderRadius: "radius5",
          bg: "background-secondary",
          color: "paragraph",
          zIndex: result.status === "fulfilled" ? result.value.length + 1 : 1
        }}
        testID="properties-add-color"
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
              onPress={() => noteStore.get().setColor(c.id, isChecked, noteId)}
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
              testID={`properties-${c.title}`}
            >
              <Ellipse
                size={25}
                color={dataColor(c.colorCode)}
                testID={`toggle-state-${isChecked ? "on" : "off"}`}
              />
              {isChecked && (
                <Checkmark
                  color="icon-selected"
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
        borderTop: "1px solid",
        borderTopColor: "separator",
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
                containerSx={{
                  bg: "background-tertiary",
                  px: "spacing3",
                  py: "spacing2",
                  ":hover": { bg: "hover" }
                }}
                onDismiss={async () => {
                  await db.relations.unlink(item, { id: noteId, type: "note" });
                  await tagStore.get().refresh();
                  await noteStore.get().refresh();
                  result.refresh();
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
        borderTop: "1px solid",
        borderTopColor: "separator",
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
                containerSx={{
                  bg: "background-tertiary",
                  px: "spacing3",
                  py: "spacing2",
                  ":hover": { bg: "hover" }
                }}
                onDismiss={async () => {
                  await db.relations.unlink(item, { id: noteId, type: "note" });
                  await notebookStore.get().refresh();
                  await noteStore.get().refresh();
                  result.refresh();
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
  const reminders = useReminderStore((store) => store.reminders);
  const result = usePromise(
    async () =>
      db.relations
        .from({ id: noteId, type: "note" }, "reminder")
        .selector.grouped(db.settings.getGroupOptions("reminders")),
    [noteId, reminders]
  );

  if (!("value" in result) || result.value === undefined) return <ListLoader />;

  return (
    <ListContainer
      type="reminders"
      group="reminders"
      compact
      items={result.value}
      refresh={result.status === "fulfilled" ? result.refresh : () => {}}
      sx={{
        flex: 1,
        px: "spacing4"
      }}
      placeholder={
        <Section
          title={strings.dataTypesPluralCamelCase.reminder()}
          sx={{ flex: 1 }}
        >
          <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
            <Text
              sx={{
                color: "paragraph-secondary",
                fontSize: "xs",
                lineHeight: 1
              }}
            >
              {strings.noRemindersToShow()}
            </Text>
            <Button
              variant="new_anchor"
              sx={{
                alignItems: "center",
                gap: "spacing3",

                p: 0,
                textDecorationLine: "none"
              }}
              onPress={async () => {
                const note = await db.notes.note(noteId);
                await AddReminderDialog.show({ note });

                if (result.status === "fulfilled") {
                  result.refresh();
                }
              }}
            >
              <Plus size={15} color="accent" />
              <Text sx={{ color: "accent", fontWeight: 600, fontSize: "xs" }}>
                {strings.createReminder()}
              </Text>
            </Button>
          </Flex>
        </Section>
      }
      renderGroupHeader={(title, index) => (
        <Section
          title={title}
          sx={{
            ...(index > 0
              ? {
                  mt: "spacing4",
                  pt: "spacing4",
                  borderTop: "1px solid",
                  borderTopColor: "separator"
                }
              : {})
          }}
          headerAction={
            index === 0 ? (
              <Button
                sx={{ p: 0 }}
                onPress={async () => {
                  const note = await db.notes.note(noteId);
                  await AddReminderDialog.show({ note });
                  if (result.status === "fulfilled") {
                    result.refresh();
                  }
                }}
              >
                <Plus size={15} color="accent" />
              </Button>
            ) : undefined
          }
        />
      )}
    />
  );
}
function Attachments({ noteId }: { noteId: string }) {
  const itemGap = 3;
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
            lineHeight: 1
          }}
        >
          {strings.noAttachedFiles()}
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
  const itemGap = 3;
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
          {strings.localOnly()}
        </Text>
      }
    >
      {result.status !== "fulfilled" || result.value.length <= 0 ? (
        <Text
          sx={{
            color: "paragraph-secondary",
            fontSize: "xs",
            lineHeight: 1
          }}
        >
          {strings.noHistoryItems()}
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
  headerAction?: ReactNode;
  sx?: SxProp;
};
export function Section({
  title,
  subtitle,
  headerAction,
  children,
  sx
}: PropsWithChildren<SectionProps>) {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        ...sx
      }}
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
                  letterSpacing: 0.33,
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
