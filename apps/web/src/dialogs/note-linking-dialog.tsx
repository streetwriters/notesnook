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
import { Lock } from "../components/icons";
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
          variant="columnFill"
          sx={{ mx: 3, overflow: "hidden", height: 500 }}
        >
          {selectedNote ? (
            <>
              <Field
                autoFocus
                placeholder={strings.searchSectionToLinkPlaceholder()}
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
                sx={{ mt: 1, textAlign: "left", flexShrink: 0 }}
                onClick={() => {
                  setSelectedNote(undefined);
                  setIsNoteLocked(false);
                  setFilteredBlocks(undefined);
                  setBlocks([]);
                }}
              >
                {strings.linkNoteSelectedNote()}: {selectedNote.title} (
                {strings.clickToDeselect()})
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
                    style={{ height: "100%", width: "100%" }}
                    components={{
                      Scroller: CustomScrollbarsVirtualList
                    }}
                    data={filteredBlocks || blocks}
                    context={{ items: filteredBlocks || blocks }}
                    itemContent={(_, item) => (
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
                          sx={{
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
                      </Button>
                    )}
                  />
                </>
              ) : (
                <Text variant="body" sx={{ mt: 1 }}>
                  {blockLinkingAvailability?.error}{" "}
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
                    Upgrade now
                  </Button>
                  .
                </Text>
              )}
            </>
          ) : (
            <>
              <Field
                autoFocus
                placeholder={strings.searchNoteToLinkPlaceholder()}
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
                <Virtuoso
                  data={notes.placeholders}
                  components={{
                    Scroller: CustomScrollbarsVirtualList
                  }}
                  style={{ height: "100%", width: "100%" }}
                  itemContent={(index) => (
                    <div style={{ height: 28 }}>
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
                    </div>
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
