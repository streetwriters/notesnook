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

import { Perform } from "../common/dialog-controller";
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
import { ResolvedItem } from "../components/list-container/resolved-item";
import { Button, Flex, Text } from "@theme-ui/components";
import { ScrollContainer } from "@notesnook/ui";
import { LinkAttributes } from "@notesnook/editor/dist/extensions/link";

export type NoteLinkingDialogProps = {
  attributes?: LinkAttributes;
  onClose: Perform;
  onDone: Perform<LinkAttributes>;
};

export default function NoteLinkingDialog(props: NoteLinkingDialogProps) {
  const { attributes } = props;
  const [notes, setNotes] = useState<VirtualizedGrouping<NoteType>>();
  const [selectedNote, setSelectedNote] = useState<NoteType>();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

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
        text: "Save",
        disabled: !selectedNote,
        onClick: () =>
          selectedNote
            ? props.onDone({
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
              onChange={async (e) =>
                setNotes(await db.lookup.notes(e.target.value).sorted())
              }
            />
            <Button variant="accentSecondary" sx={{ mt: 1, textAlign: "left" }}>
              Selected note: {selectedNote.title}
            </Button>
            <ScrollContainer>
              <VirtualizedList
                items={blocks}
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
                      alignItems: "center"
                    }}
                    onClick={() => {
                      props.onDone({
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
                      {item.content}
                    </Text>
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
              onChange={async (e) =>
                setNotes(await db.lookup.notes(e.target.value).sorted())
              }
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
                      {({ item: note }) => (
                        <Button
                          variant="menuitem"
                          sx={{ p: 1, width: "100%", textAlign: "left" }}
                          onClick={async () => {
                            setSelectedNote(note);
                            setBlocks(await db.notes.getBlocks(note.id));
                          }}
                        >
                          <Text variant="body">{note.title}</Text>
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
