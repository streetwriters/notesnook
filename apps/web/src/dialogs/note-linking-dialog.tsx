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

import Field from "../components/field";
import Dialog from "../components/dialog";
import { useState } from "react";
import { db } from "../common/db";
import {
  ContentBlock,
  Note as NoteType,
  VirtualizedGrouping,
  createInternalLink
} from "@notesnook/core";
import { Button, Flex, Text } from "@theme-ui/components";
import { LinkAttributes } from "@notesnook/editor";
import {
  NoteResolvedData,
  ResolvedItem,
  useIsFeatureAvailable
} from "@notesnook/common";
import {
  CheckIcon,
  FileText,
  Lock,
  MagnifyingGlass
} from "../components/icons";
import { ellipsize } from "@notesnook/core";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { Virtuoso } from "react-virtuoso";
import { CustomScrollbarsVirtualList } from "../components/list-container";
import { UpgradeDialog } from "./buy-dialog/upgrade-dialog";

export type NoteLinkingDialogProps = BaseDialogProps<LinkAttributes | false> & {
  attributes?: LinkAttributes;
};
const HEADING_TYPES = ["h1", "h2", "h3", "h4", "h5", "h6"];
const NOTE_ITEM_HEIGHT = 35;
const LIST_MAX_HEIGHT = 315;

type ListContext = { header?: React.ReactNode };

export const NoteLinkingDialog = DialogManager.register(
  function NoteLinkingDialog(props: NoteLinkingDialogProps) {
    const { attributes } = props;
    const [notes, setNotes] = useState<VirtualizedGrouping<NoteType>>();
    const [noteQuery, setNoteQuery] = useState("");
    const [selectedNote, setSelectedNote] = useState<NoteType>();
    const [isNoteLocked, setIsNoteLocked] = useState(false);
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [filteredBlocks, setFilteredBlocks] = useState<
      ContentBlock[] | undefined
    >();
    const [blocksHeight, setBlocksHeight] = useState(LIST_MAX_HEIGHT);
    const blockLinkingAvailability = useIsFeatureAvailable("blockLinking");

    const deselectNote = () => {
      setSelectedNote(undefined);
      setIsNoteLocked(false);
      setFilteredBlocks(undefined);
      setBlocks([]);
    };

    const selectedNoteRow = selectedNote ? (
      <SelectedNoteItem
        note={selectedNote}
        isLocked={isNoteLocked}
        onClick={deselectNote}
      >
        {blockLinkingAvailability &&
        !blockLinkingAvailability.isAllowed ? null : isNoteLocked ? (
          <HelperText>{strings.noteLockedBlockLink()}</HelperText>
        ) : blocks.length <= 0 ? (
          <HelperText>{strings.noBlocksOnNote()}</HelperText>
        ) : null}
      </SelectedNoteItem>
    ) : null;

    const showBlocks =
      !!selectedNote &&
      !!blockLinkingAvailability?.isAllowed &&
      blocks.length > 0;

    return (
      <Dialog
        isOpen={true}
        title={
          attributes ? strings.editInternalLink() : strings.newInternalLink()
        }
        width={460}
        onClose={() => props.onClose(false)}
        onOpen={async () => {
          setNotes(
            await db.notes.all.sorted(db.settings.getGroupOptions("home"))
          );
        }}
        positiveButton={{
          text: attributes ? strings.done() : strings.insertLink(),
          disabled: !selectedNote,
          onClick: () =>
            selectedNote
              ? props.onClose({
                  title: selectedNote.title,
                  href: createInternalLink("note", selectedNote.id)
                })
              : null
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => props.onClose(false)
        }}
        noScroll
      >
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing7",
            p: "spacing7",
            overflow: "hidden",
            minHeight: 0
          }}
        >
          {selectedNote ? (
            <SearchField
              key="block-search"
              placeholder={strings.searchSectionToLinkPlaceholder()}
              onChange={(value) => {
                const query = value.trim().toLowerCase();
                if (!query) {
                  setFilteredBlocks(undefined);
                } else {
                  setFilteredBlocks(
                    query.startsWith("#")
                      ? blocks.filter(
                          (v) =>
                            HEADING_TYPES.includes(v.type) &&
                            v.content.toLowerCase().includes(query)
                        )
                      : blocks.filter((v) =>
                          v.content.toLowerCase().includes(query)
                        )
                  );
                }
              }}
            />
          ) : (
            <SearchField
              key="note-search"
              placeholder={strings.searchNoteToLinkPlaceholder()}
              onChange={async (value) => {
                const query = value.trim();
                setNoteQuery(query);
                setNotes(
                  query
                    ? await db.lookup.notes(value).sorted()
                    : await db.notes.all.sorted(
                        db.settings.getGroupOptions("home")
                      )
                );
              }}
            />
          )}

          {selectedNote ? (
            showBlocks ? (
              <Virtuoso
                key="block-list"
                style={{
                  height: Math.min(blocksHeight, LIST_MAX_HEIGHT),
                  width: "100%",
                  flexShrink: 1,
                  minHeight: 0
                }}
                components={{
                  Scroller: CustomScrollbarsVirtualList,
                  Header: SelectedNoteHeader
                }}
                totalListHeightChanged={setBlocksHeight}
                data={filteredBlocks || blocks}
                context={{ header: selectedNoteRow } as ListContext}
                itemContent={(_, item) => (
                  <BlockItem
                    block={item}
                    onClick={() => {
                      props.onClose({
                        title: selectedNote.title,
                        href: createInternalLink("note", selectedNote.id, {
                          blockId: item.id
                        })
                      });
                    }}
                  />
                )}
              />
            ) : (
              <Flex
                sx={{ flexDirection: "column", gap: "spacing4", flexShrink: 0 }}
              >
                {selectedNoteRow}
                {blockLinkingAvailability &&
                !blockLinkingAvailability.isAllowed ? (
                  <Flex
                    sx={{
                      p: "spacing2",
                      borderRadius: "radius1",
                      bg: "background-secondary"
                    }}
                  >
                    <HelperText>
                      {blockLinkingAvailability.error}{" "}
                      <Button
                        variant="anchor"
                        sx={{ fontSize: "3xs", lineHeight: 1 }}
                        onClick={() =>
                          UpgradeDialog.show({
                            feature: blockLinkingAvailability
                          })
                        }
                      >
                        {strings.upgradeNow()}
                      </Button>
                      .
                    </HelperText>
                  </Flex>
                ) : null}
              </Flex>
            )
          ) : notes ? (
            notes.length <= 0 ? (
              noteQuery ? (
                <EmptyState
                  title={strings.noResultsFound()}
                  description={`We couldn’t find any note matching “${noteQuery}”.`}
                  descriptionFontSize="sm"
                />
              ) : (
                <EmptyState
                  title={strings.notePlaceholder.title()}
                  description="Create a note first, then you can link to it here."
                  descriptionFontSize="xs"
                />
              )
            ) : (
              <Virtuoso
                key="note-list"
                data={notes.placeholders}
                fixedItemHeight={NOTE_ITEM_HEIGHT}
                components={{
                  Scroller: CustomScrollbarsVirtualList
                }}
                style={{
                  height: Math.min(
                    notes.length * NOTE_ITEM_HEIGHT,
                    LIST_MAX_HEIGHT
                  ),
                  width: "100%",
                  flexShrink: 1,
                  minHeight: 0
                }}
                itemContent={(index) => (
                  <div style={{ height: NOTE_ITEM_HEIGHT }}>
                    <ResolvedItem items={notes} index={index} type="note">
                      {({ item: note, data }) => (
                        <NoteItem
                          note={note}
                          isLocked={!!(data as NoteResolvedData).locked}
                          onClick={async () => {
                            setSelectedNote(note);
                            setIsNoteLocked(
                              !!(data as NoteResolvedData).locked
                            );
                            setBlocks(await db.notes.contentBlocks(note.id));
                          }}
                        />
                      )}
                    </ResolvedItem>
                  </div>
                )}
              />
            )
          ) : null}
        </Flex>
      </Dialog>
    );
  }
);

function SelectedNoteHeader({ context }: { context?: ListContext }) {
  return <Flex sx={{ pb: "spacing4" }}>{context?.header}</Flex>;
}

function SearchField(props: {
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field
      autoFocus
      placeholder={props.placeholder}
      leftIcon={MagnifyingGlass}
      sx={{ flexShrink: 0 }}
      styles={{
        input: {
          pl: "spacing10",
          pr: "spacing4",
          py: "spacing6",
          height: 50,
          fontSize: "sm",
          lineHeight: 1,
          color: "heading"
        }
      }}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

function NoteIconTile(props: { selected?: boolean }) {
  return (
    <Flex
      className="note-icon-tile"
      sx={{
        width: 25,
        height: 25,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "radius1",
        bg: props.selected ? "background" : "background-secondary"
      }}
    >
      <FileText size={13} color="icon" />
    </Flex>
  );
}

function NoteItem(props: {
  note: NoteType;
  isLocked: boolean;
  onClick: () => void;
}) {
  const { note, isLocked, onClick } = props;
  return (
    <Button
      variant="menuitem"
      title={note.title}
      sx={{
        p: "spacing2",
        width: "100%",
        height: NOTE_ITEM_HEIGHT,
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: "spacing3",
        borderRadius: "radius1",
        bg: "transparent",
        ":hover": {
          bg: "hover",
          ".note-icon-tile": { bg: "hover-secondary" }
        }
      }}
      onClick={onClick}
    >
      <NoteIconTile />
      <Text
        sx={{
          fontSize: "xs",
          color: "paragraph",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        {note.title}
      </Text>
      {isLocked ? (
        <Lock size={13} color="icon-secondary" sx={{ flexShrink: 0 }} />
      ) : null}
    </Button>
  );
}

function SelectedNoteItem(
  props: React.PropsWithChildren<{
    note: NoteType;
    isLocked: boolean;
    onClick: () => void;
  }>
) {
  const { note, isLocked, onClick, children } = props;
  return (
    <Flex
      role="button"
      data-test-id="selected-note"
      onClick={onClick}
      sx={{
        width: "100%",
        flexShrink: 0,
        flexDirection: "column",
        justifyContent: "center",
        gap: "spacing3",
        p: "spacing2",
        borderRadius: "radius1",
        bg: "background-selected",
        cursor: "pointer"
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          gap: "spacing3"
        }}
      >
        <Flex sx={{ alignItems: "center", gap: "spacing3", minWidth: 0 }}>
          <NoteIconTile selected />
          <Text
            title={note.title}
            sx={{
              fontSize: "xs",
              fontWeight: 500,
              color: "paragraph-selected",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {note.title}
          </Text>
          {isLocked ? (
            <Lock size={13} color="icon-secondary" sx={{ flexShrink: 0 }} />
          ) : null}
        </Flex>
        <CheckIcon size={13} color="accent" sx={{ flexShrink: 0 }} />
      </Flex>
      <HelperText>{strings.clickToDeselect()}</HelperText>
      {children}
    </Flex>
  );
}

function HelperText(props: React.PropsWithChildren) {
  return (
    <Text sx={{ fontSize: "3xs", lineHeight: 1, color: "paragraph" }}>
      {props.children}
    </Text>
  );
}

function BlockItem(props: { block: ContentBlock; onClick: () => void }) {
  const { block, onClick } = props;
  return (
    <Flex sx={{ flexDirection: "column", gap: "spacing2", pb: "spacing2" }}>
      <Button
        variant="menuitem"
        sx={{
          p: "spacing2",
          width: "100%",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "spacing3",
          borderRadius: "radius1",
          bg: "transparent",
          ":hover": {
            bg: "hover",
            ".block-content": { color: "heading" },
            ".block-type": { bg: "hover-secondary" }
          }
        }}
        onClick={onClick}
      >
        <Flex
          className="block-content"
          sx={{
            flexDirection: "column",
            gap: "spacing3",
            minWidth: 0,
            color: "paragraph"
          }}
        >
          {(
            ellipsize(block.content, 200, "end").trim() ||
            strings.linkNoteEmptyBlock()
          )
            .split("\n")
            .map((line, index) => (
              <Text
                key={index}
                sx={{
                  fontSize: "xs",
                  lineHeight: 1,
                  color: "inherit",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}
              >
                {line}
              </Text>
            ))}
        </Flex>
        <Text
          className="block-type"
          sx={{
            flexShrink: 0,
            p: "spacing1",
            bg: "background-secondary",
            borderRadius: "radius0",
            fontSize: "xs",
            lineHeight: 1,
            color: "paragraph"
          }}
        >
          {block.type.toUpperCase()}
        </Text>
      </Button>
      <Flex sx={{ height: 1, bg: "separator", flexShrink: 0 }} />
    </Flex>
  );
}

function EmptyState(props: {
  title: string;
  description: string;
  descriptionFontSize: "xs" | "sm";
}) {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "spacing3",
        py: "spacing9",
        textAlign: "center"
      }}
    >
      <Text
        sx={{
          fontSize: "sm",
          fontWeight: 600,
          lineHeight: "normal",
          color: "heading"
        }}
      >
        {props.title}
      </Text>
      <Text
        sx={{
          fontSize: props.descriptionFontSize,
          lineHeight: props.descriptionFontSize === "sm" ? 1 : "normal",
          color: "paragraph-secondary"
        }}
      >
        {props.description}
      </Text>
    </Flex>
  );
}
