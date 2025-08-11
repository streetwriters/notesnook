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

import { useEffect, useState, useRef } from "react";
import { Flex, Button, Text, Box } from "@theme-ui/components";
import { db } from "../common/db";
import Dialog from "../components/dialog";
import { Note, VirtualizedGrouping } from "@notesnook/core";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import Field from "../components/field";
import { showToast } from "../utils/toast";
import { store as noteStore } from "../stores/note-store";
import { Cross, Plus } from "../components/icons";
import { ReorderableList } from "../components/navigation-menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ScrollContainer from "../components/scroll-container";
import { Virtuoso } from "react-virtuoso";
import { CustomScrollbarsVirtualList } from "../components/list-container";
import { ResolvedItem } from "@notesnook/common";
import { Lock } from "../components/icons";

type MergeNotesDialogProps = BaseDialogProps<boolean> & {
  noteIds?: string[];
};

export const MergeNotesDialog = DialogManager.register(function MergeNotesDialog(
  props: MergeNotesDialogProps
) {
  const { onClose, noteIds = [] } = props;
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async function () {
      if (noteIds.length === 0) return;
      const initialNotes: Note[] = [];
      for (const id of noteIds) {
        const note = await db.notes.note(id);
        if (note) {
          initialNotes.push(note)
          if (titleRef.current && !titleRef.current.value) {
            titleRef.current.value = note.title;
          }
        }
      }
      setSelectedNotes(initialNotes);
    })();
  }, [noteIds]);

  const handleAddNoteClick = async () => {
    const result = await SelectNoteDialog.show({
      excludeNoteIds: selectedNotes.map(n => n.id)
    });
    if (result) {
      setSelectedNotes(prev => [...prev, ...result]);
    }
  };

  const handleRemoveNote = (noteId: string) => {
    setSelectedNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const handleMerge = async () => {
    const title = titleRef.current?.value;
    if (!title?.trim()) {
      showToast("error", "Please provide a title for the merged note");
      return;
    }

    try {
      setIsCreating(true);
      await noteStore.merge(title, selectedNotes.map(n => n.id));
      showToast("success", "Notes merged successfully");
      onClose(true);
    } catch (error) {
      showToast("error", "Failed to merge notes: " + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const canMerge = titleRef.current?.value.trim() && selectedNotes.length >= 2;

  return (
    <Dialog
      isOpen={true}
      title="Merge Notes"
      onClose={() => onClose(false)}
      width={600}
      positiveButton={{
        text: "Merge",
        onClick: handleMerge,
        loading: isCreating,
        disabled: !canMerge
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => onClose(false)
      }}
      noScroll
    >
      <Flex
        variant="columnFill"
        sx={{ mx: 4, gap: 3, py: 2, height: 500, overflow: "hidden" }}
      >
        <Field
          inputRef={titleRef}
          autoFocus
          label="Title for merged note"
          placeholder="Enter title for the merged note"
          sx={{ mx: 0 }}
        />

        <Flex sx={{ flexDirection: "column", gap: 1 }}>
          <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Text variant="title"
              sx={{
                fontSize: "subtitle",
                fontWeight: "bold",
                fontFamily: "body",
                color: "paragraph",
              }}>Notes to merge ({selectedNotes.length})</Text>
            <Button
              variant="secondary"
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
              onClick={handleAddNoteClick}
            >
              <Plus size={14} />
              Add note
            </Button>
          </Flex>

          {selectedNotes.length > 0 ? (
            <ScrollContainer style={{ height: 275 }}>
              <ReorderableList
                items={selectedNotes}
                orderKey="merge-notes-selected"
                order={() => selectedNotes.map(n => n.id)}
                onOrderChanged={(newOrder: string[]) => {
                  const reorderedNotes = newOrder
                    .map(id => selectedNotes.find(n => n.id === id))
                    .filter(Boolean) as Note[];
                  setSelectedNotes(reorderedNotes);
                }}
                context={{ onRemove: handleRemoveNote }}
                renderItem={SortableNoteItem}
              />
            </ScrollContainer>
          ) : (
            <Text variant="body" sx={{ textAlign: "center", py: 3, color: "paragraph-secondary" }}>
              No notes selected. Add notes to start merging.
            </Text>
          )}
        </Flex>

        {selectedNotes.length >= 2 && (
          <Text variant="subBody" sx={{ color: "paragraph-secondary", textAlign: "center" }}>
            Drag to reorder notes. Content will be merged in this order.
          </Text>
        )}
      </Flex>
    </Dialog>
  );
});

type SelectNoteDialogProps = BaseDialogProps<Note[] | false> & {
  excludeNoteIds?: string[];
};

export const SelectNoteDialog = DialogManager.register(function SelectNoteDialog(
  props: SelectNoteDialogProps
) {
  const { onClose, excludeNoteIds = [] } = props;
  const [notes, setNotes] = useState<VirtualizedGrouping<Note>>();
  const [selectedNotes, setSelectedNotes] = useState<Note[]>([]);

  useEffect(() => {
    (async function () {
      setNotes(
        await db.notes.all.sorted(db.settings.getGroupOptions("home"))
      );
    })();
  }, []);

  const handleSelectNote = (note: Note) => {
    setSelectedNotes(prev => {
      const isAlreadySelected = prev.find(n => n.id === note.id);
      if (isAlreadySelected) {
        return prev.filter(n => n.id !== note.id);
      } else {
        return [...prev, note];
      }
    });
  };

  return (
    <Dialog
      isOpen={true}
      title="Select Notes to Merge"
      onClose={() => onClose(false)}
      width={500}
      positiveButton={{
        text: `Add ${selectedNotes.length} Note${selectedNotes.length !== 1 ? 's' : ''}`,
        onClick: () => selectedNotes.length > 0 ? onClose(selectedNotes) : null,
        disabled: selectedNotes.length === 0
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => onClose(false)
      }}
      noScroll
    >
      <Flex
        variant="columnFill"
        sx={{ mx: 3, overflow: "hidden", height: 500 }}
      >
        <Field
          autoFocus
          placeholder="Search notes"
          sx={{ mb: 2 }}
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

        {selectedNotes.length > 0 && (
          <Button
            sx={{
              mb: 2,
              p: 1,
              bg: "background-secondary",
              borderRadius: "default",
              fontSize: "subBody",
              color: 'accent',
              textAlign: "center",
            }}
            onClick={() => setSelectedNotes([])}
          >
            {selectedNotes.length} note{selectedNotes.length !== 1 ? 's' : ''} selected. Click to deselect.
          </Button>
        )}

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
                  {({ item: note, data }) => {
                    const isExcluded = excludeNoteIds.includes(note.id);
                    const isSelected = selectedNotes.find(n => n.id === note.id);

                    return (
                      <Button
                        variant="menuitem"
                        disabled={isExcluded}
                        onClick={() => handleSelectNote(note)}
                        sx={{
                          p: 1,
                          width: "100%",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          borderBottom: "1px solid var(--border)",
                          opacity: isExcluded ? 0.3 : 1,
                          bg: isSelected ? "background-selected" : "transparent",
                          "&:hover": {
                            bg: isExcluded ? "transparent" : (isSelected ? "background-selected" : "hover")
                          }
                        }}
                      >
                        <Text variant="body">{note.title || "Untitled"}</Text>
                        {isSelected && (
                          <Text variant="subBody" sx={{ ml: "auto", color: "accent" }}>
                            ✓
                          </Text>
                        )}
                        {(data as any).locked && <Lock size={14} />}
                      </Button>
                    );
                  }}
                </ResolvedItem>
              </div>
            )}
          />
        )}
      </Flex>
    </Dialog>
  );
});

type SortableNoteItemProps = {
  item: Note;
  context?: { onRemove: (id: string) => void };
  isOverlay?: boolean;
};

function SortableNoteItem({
  item: note,
  context,
  isOverlay
}: SortableNoteItemProps
) {
  const { attributes, listeners, setNodeRef, transform, transition, active } =
    useSortable({ id: note.id });

  return (
    <Flex
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        alignItems: "center",
        gap: 1,
        p: 1,
        mx: 1,
        my: 1,
        borderRadius: "default",
        border: "1px solid",
        borderColor: isOverlay ? "accent" : "border",
        bg: "background-secondary",
        cursor: "grab",
        "&:active": {
          cursor: "grabbing"
        },
        transform: CSS.Transform.toString(transform),
        transition,
        visibility: active?.id === note.id ? "hidden" : "visible"
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Flex sx={{ flexDirection: "column", gap: 1 }}>
          <Text variant="body">{note.title || "Untitled"}</Text>
          {note.headline && (
            <Text variant="subBody">
              {note.headline.substring(0, 250)}{note.headline.length > 250 ? "..." : ""}
            </Text>
          )}
        </Flex>
      </Box>
      {context?.onRemove && (
        <Button
          variant="secondary"
          sx={{ p: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            context.onRemove(note.id);
          }}
        >
          <Cross size={14} />
        </Button>
      )}
    </Flex>
  )
}