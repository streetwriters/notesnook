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

import { useState } from "react";
import { Button, Flex, Text, Virtuoso } from "@notesnook/ui-kit";
import {
  ContentBlock,
  Note as NoteType,
  VirtualizedGrouping,
  createInternalLink,
  ellipsize
} from "@notesnook/core";
import {
  NoteResolvedData,
  ResolvedItem,
  useIsFeatureAvailable
} from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { db } from "../common/db";
import { Lock } from "../components/icons";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { UpgradeDialog } from "./buy-dialog/upgrade-dialog";
import { Field } from "./components/field";
import Dialog from "../components/dialog";

export type LinkAttributes = {
  href: string;
  title?: string;
  [key: string]: unknown;
};

export type NoteLinkingDialogProps = BaseDialogProps<LinkAttributes | false> & {
  attributes?: LinkAttributes;
};

const HEADING_TYPES = ["h1", "h2", "h3", "h4", "h5", "h6"];

export const NoteLinkingDialog = DialogManager.register(
  function NoteLinkingDialog(props: NoteLinkingDialogProps) {
    const { attributes } = props;
    const [notes, setNotes] = useState<VirtualizedGrouping<NoteType>>();
    const [selectedNote, setSelectedNote] = useState<NoteType>();
    const [isNoteLocked, setIsNoteLocked] = useState(false);
    const [blocks, setBlocks] = useState<ContentBlock[]>([]);
    const [filteredBlocks, setFilteredBlocks] = useState<
      ContentBlock[] | undefined
    >();
    const blockLinkingAvailability = useIsFeatureAvailable("blockLinking");
    const visibleBlocks = filteredBlocks || blocks;

    return (
      <Dialog
        isOpen={true}
        title={
          attributes ? strings.editInternalLink() : strings.newInternalLink()
        }
        width={500}
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
            mx: 3,
            overflow: "hidden",
            height: 500
          }}
        >
          {selectedNote ? (
            <>
              <Field
                autoFocus
                placeholder={strings.searchSectionToLinkPlaceholder()}
                onChange={({ target: { value: text } }) => {
                  const query = text.trim().toLowerCase();
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
              <Button
                variant="accentSecondary"
                sx={{ mt: 1, flexShrink: 0 }}
                onClick={() => {
                  setSelectedNote(undefined);
                  setIsNoteLocked(false);
                  setFilteredBlocks(undefined);
                  setBlocks([]);
                }}
              >
                <Text>
                  {strings.linkNoteSelectedNote()}: {selectedNote.title} (
                  {strings.clickToDeselect()})
                </Text>
              </Button>
              {blockLinkingAvailability?.isAllowed ? (
                <>
                  {isNoteLocked ? (
                    <Text variant="body" sx={{ mt: 1 }}>
                      {strings.noteLockedBlockLink()}
                    </Text>
                  ) : blocks.length <= 0 ? (
                    <Text variant="body" sx={{ mt: 1 }}>
                      {strings.noBlocksOnNote()}
                    </Text>
                  ) : null}
                  <Virtuoso
                    totalCount={visibleBlocks.length}
                    defaultItemHeight={36}
                    computeItemKey={(index) => visibleBlocks[index].id}
                    style={{ flex: 1 }}
                    itemContent={(index) => {
                      const item = visibleBlocks[index];
                      return (
                        <Flex
                          onClick={() => {
                            props.onClose({
                              title: selectedNote.title,
                              href: createInternalLink(
                                "note",
                                selectedNote.id,
                                { blockId: item.id }
                              )
                            });
                          }}
                          sx={{
                            p: 1,
                            width: "100%",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid",
                            borderBottomColor: "border",
                            ":hover": { bg: "hover" }
                          }}
                        >
                          <Text
                            variant="body"
                            sx={{
                              flex: 1,
                              fontFamily: "monospace",
                              whiteSpace: "pre-wrap"
                            }}
                          >
                            {ellipsize(item.content, 200, "end").trim() ||
                              strings.linkNoteEmptyBlock()}
                          </Text>
                          <Text
                            variant="subBody"
                            sx={{
                              bg: "background-secondary",
                              flexShrink: 0,
                              p: "small",
                              px: 1,
                              borderRadius: "default",
                              alignSelf: "flex-start"
                            }}
                          >
                            {item.type.toUpperCase()}
                          </Text>
                        </Flex>
                      );
                    }}
                  />
                </>
              ) : (
                <Flex sx={{ flexDirection: "row", mt: 1, gap: 1 }}>
                  <Text variant="body">{blockLinkingAvailability?.error}</Text>
                  <Button
                    onClick={() =>
                      blockLinkingAvailability
                        ? UpgradeDialog.show({
                            feature: blockLinkingAvailability
                          })
                        : null
                    }
                    variant="anchor"
                  >
                    <Text>{strings.upgradeNow()}</Text>
                  </Button>
                </Flex>
              )}
            </>
          ) : (
            <>
              <Field
                autoFocus
                placeholder={strings.searchNoteToLinkPlaceholder()}
                onChange={async ({ target: { value: text } }) => {
                  const query = text.trim();
                  setNotes(
                    query
                      ? await db.lookup.notes(text).sorted()
                      : await db.notes.all.sorted(
                          db.settings.getGroupOptions("home")
                        )
                  );
                }}
              />
              {notes && (
                <Virtuoso
                  totalCount={notes.placeholders.length}
                  defaultItemHeight={28}
                  computeItemKey={(index) => notes.key(index)}
                  style={{ flex: 1 }}
                  itemContent={(index) => (
                    <Flex sx={{ height: 28 }}>
                      <ResolvedItem items={notes} index={index} type="note">
                        {({ item: note, data }) => (
                          <Flex
                            onClick={async () => {
                              setSelectedNote(note);
                              setIsNoteLocked(
                                !!(data as NoteResolvedData).locked
                              );
                              setBlocks(await db.notes.contentBlocks(note.id));
                            }}
                            sx={{
                              p: 1,
                              width: "100%",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 1,
                              borderBottom: "1px solid",
                              borderBottomColor: "border",
                              ":hover": { bg: "hover" }
                            }}
                          >
                            <Text variant="body">{note.title}</Text>
                            {(data as NoteResolvedData).locked ? (
                              <Lock size={14} />
                            ) : null}
                          </Flex>
                        )}
                      </ResolvedItem>
                    </Flex>
                  )}
                />
              )}
            </>
          )}
        </Flex>
      </Dialog>
    );
  }
);
