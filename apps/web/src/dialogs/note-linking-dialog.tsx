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
import { VirtualizedList } from "../components/virtualized-list";
import { Button, Flex, Text } from "@theme-ui/components";
import { ScrollContainer } from "@notesnook/ui";
import { LinkAttributes } from "@notesnook/editor/dist/extensions/link";
import { NoteResolvedData, ResolvedItem } from "@notesnook/common";
import { Lock } from "../components/icons";
import { ellipsize } from "@notesnook/core/dist/utils/content-block";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";

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

    return (
      <Dialog
        isOpen={true}
        title={attributes ? "Edit internal link" : "Link to note"}
        width={500}
        onClose={() => props.onClose(false)}
        onOpen={async () => {
          setNotes(
            await db.notes.all.sorted(db.settings.getGroupOptions("home"))
          );
        }}
        positiveButton={{
          text: "Insert link",
          disabled: !selectedNote,
          onClick: () =>
            selectedNote
              ? props.onClose({
                  title: selectedNote.title,
                  href: createInternalLink("note", selectedNote.id)
                })
              : null
        }}
        negativeButton={{ text: "Cancel", onClick: () => props.onClose(false) }}
        noScroll
      >
        <Flex variant="columnFill" sx={{ mx: 3, overflow: "hidden" }}>
          {selectedNote ? (
            <>
              <Field
                autoFocus
                placeholder="Type # to only search headings"
                sx={{ mx: 0 }}
                onChange={async (e) => {
                  const query = e.target.value.trim().toLowerCase();
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
                sx={{ mt: 1, textAlign: "left" }}
                onClick={() => {
                  setSelectedNote(undefined);
                  setIsNoteLocked(false);
                  setFilteredBlocks(undefined);
                  setBlocks([]);
                }}
              >
                Selected note: {selectedNote.title} (click to deselect)
              </Button>
              {isNoteLocked ? (
                <Text variant="body" sx={{ mt: 1 }}>
                  Linking to a specific block is not available for locked notes.
                </Text>
              ) : blocks.length <= 0 ? (
                <Text variant="body" sx={{ mt: 1 }}>
                  There are no blocks in this note.
                </Text>
              ) : null}
              <ScrollContainer>
                <VirtualizedList
                  items={filteredBlocks || blocks}
                  estimatedSize={34}
                  mode="dynamic"
                  itemGap={5}
                  getItemKey={(i) => blocks[i].id}
                  mt={1}
                  renderItem={({ item }) => (
                    <Button
                      variant="menuitem"
                      sx={{
                        p: 1,
                        width: "100%",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid var(--border)"
                      }}
                      onClick={() => {
                        props.onClose({
                          title: selectedNote.title,
                          href: createInternalLink("note", selectedNote.id, {
                            blockId: item.id
                          })
                        });
                      }}
                    >
                      <Text
                        variant="body"
                        sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
                      >
                        {ellipsize(item.content, 200, "end").trim() ||
                          "(empty block)"}
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
                    </Button>
                  )}
                />
              </ScrollContainer>
            </>
          ) : (
            <>
              <Field
                autoFocus
                placeholder="Search for a note to link to..."
                sx={{ mx: 0 }}
                onChange={async (e) => {
                  const query = e.target.value.trim();
                  setNotes(
                    query
                      ? await db.lookup.notes(e.target.value).sorted()
                      : await db.notes.all.sorted(
                          db.settings.getGroupOptions("home")
                        )
                  );
                }}
              />
              {notes && (
                <ScrollContainer>
                  <VirtualizedList
                    items={notes.placeholders}
                    estimatedSize={28}
                    itemGap={5}
                    getItemKey={notes.key}
                    mt={1}
                    renderItem={({ index }) => (
                      <ResolvedItem items={notes} index={index} type="note">
                        {({ item: note, data }) => (
                          <Button
                            variant="menuitem"
                            sx={{
                              p: 1,
                              width: "100%",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              borderBottom: "1px solid var(--border)"
                            }}
                            onClick={async () => {
                              setSelectedNote(note);
                              setIsNoteLocked(
                                !!(data as NoteResolvedData).locked
                              );
                              setBlocks(await db.notes.contentBlocks(note.id));
                            }}
                          >
                            <Text variant="body">{note.title}</Text>
                            {(data as NoteResolvedData).locked ? (
                              <Lock size={14} />
                            ) : null}
                          </Button>
                        )}
                      </ResolvedItem>
                    )}
                  />
                </ScrollContainer>
              )}
            </>
          )}
        </Flex>
      </Dialog>
    );
  }
);
