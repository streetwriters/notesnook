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

import { useEffect } from "react";
import { Flex, Text } from "@theme-ui/components";
import {
  CheckCircleOutline,
  CheckRemove,
  CircleEmpty
} from "../components/icons";
import { db } from "../common/db";
import Dialog from "../components/dialog";
import { useStore, store } from "../stores/tag-store";
import { store as notestore } from "../stores/note-store";
import { store as editorStore } from "../stores/editor-store";
import { Perform } from "../common/dialog-controller";
import { FilteredList } from "../components/filtered-list";
import { ItemReference, Tag } from "@notesnook/core/dist/types";
import { ResolvedItem } from "../components/list-container/resolved-item";
import { create } from "zustand";

type SelectedReference = {
  id: string;
  new: boolean;
  op: "add" | "remove";
};

interface ISelectionStore {
  selected: SelectedReference[];
  setSelected(refs: SelectedReference[]): void;
}
export const useSelectionStore = create<ISelectionStore>((set) => ({
  selected: [],
  setSelected: (selected) => set({ selected: selected.slice() })
}));

export type AddTagsDialogProps = {
  onClose: Perform;
  noteIds: string[];
};

function AddTagsDialog(props: AddTagsDialogProps) {
  const { onClose, noteIds } = props;

  const tags = useStore((store) => store.tags);

  useEffect(() => {
    (async function () {
      if (!tags) {
        await useStore.getState().refresh();
        return;
      }
      const selected: SelectedReference[] = [];
      const selectedTags = await db.relations
        .to({ type: "note", ids: noteIds }, "tag")
        .get();
      selectedTags.forEach((r) => {
        if (selected.findIndex((a) => a.id === r.fromId) > -1) return;
        selected.push({ id: r.fromId, op: "add", new: false });
      });
      useSelectionStore.getState().setSelected(selected);
    })();
  }, [tags, noteIds]);

  return (
    <Dialog
      isOpen={true}
      title={"Add tags"}
      description={`Add tags to multiple notes at once`}
      onClose={() => onClose(false)}
      width={450}
      positiveButton={{
        text: "Done",
        onClick: async () => {
          for (const id of noteIds) {
            for (const item of useSelectionStore.getState().selected) {
              const tagRef: ItemReference = { type: "tag", id: item.id };
              const noteRef: ItemReference = { id, type: "note" };
              if (item.op === "add") await db.relations.add(tagRef, noteRef);
              else await db.relations.unlink(tagRef, noteRef);
            }
          }
          await editorStore.get().refreshTags();
          await store.get().refresh();
          await notestore.get().refresh();
          onClose(true);
        }
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => onClose(false)
      }}
    >
      {tags && (
        <FilteredList
          getItemKey={(index) => tags.key(index)}
          mode="fixed"
          estimatedSize={30}
          items={tags.ids}
          sx={{ mt: 2 }}
          itemGap={5}
          placeholders={{
            empty: "Add a new tag",
            filter: "Search or add a new tag"
          }}
          filter={(query) => db.lookup.tags(query).ids()}
          onCreateNewItem={async (title) => {
            const tagId = await db.tags.add({ title });
            if (!tagId) return;
            const { selected, setSelected } = useSelectionStore.getState();
            setSelected([...selected, { id: tagId, new: true, op: "add" }]);
          }}
          renderItem={({ item: index }) => {
            return (
              <ResolvedItem key={index} type="tag" items={tags} index={index}>
                {({ item }) => <TagItem tag={item} />}
              </ResolvedItem>
            );
          }}
        />
      )}
    </Dialog>
  );
}

function TagItem(props: { tag: Tag }) {
  const { tag } = props;

  return (
    <Flex
      as="li"
      data-test-id="tag"
      sx={{
        cursor: "pointer",
        justifyContent: "space-between",
        alignItems: "center",
        bg: "var(--background-secondary)",
        borderRadius: "default",
        p: 1
      }}
      onClick={() => {
        const { selected, setSelected } = useSelectionStore.getState();

        const copy = selected.slice();
        const index = copy.findIndex((item) => item.id === tag.id);
        const isNew = copy[index] && copy[index].new;
        if (isNew) {
          copy.splice(index, 1);
        } else if (index > -1) {
          copy[index] = {
            ...copy[index],
            op: copy[index].op === "add" ? "remove" : "add"
          };
        } else {
          copy.push({ id: tag.id, new: true, op: "add" });
        }
        setSelected(copy);
      }}
    >
      <Flex sx={{ alignItems: "center" }}>
        <SelectedCheck size={20} id={tag.id} />
        <Text
          className="title"
          data-test-id="notebook-title"
          variant="subtitle"
          sx={{ fontWeight: "body", color: "paragraph" }}
        >
          #{tag.title}
        </Text>
      </Flex>
    </Flex>
  );
}

export default AddTagsDialog;

function SelectedCheck({ id, size = 20 }: { id: string; size?: number }) {
  const selected = useSelectionStore((store) => store.selected);
  const selectedTag = selected.find((item) => item.id === id);

  return selectedTag?.op === "add" ? (
    <CheckCircleOutline size={size} sx={{ mr: 1 }} color="accent" />
  ) : selectedTag?.op === "remove" ? (
    <CheckRemove size={size} sx={{ mr: 1 }} color="icon-error" />
  ) : (
    <CircleEmpty size={size} sx={{ mr: 1, opacity: 0.4 }} />
  );
}

function tagHasNotes(tagId: string, noteIds: string[]) {
  return db.relations.from({ type: "tag", id: tagId }, "note").has(...noteIds);
}
