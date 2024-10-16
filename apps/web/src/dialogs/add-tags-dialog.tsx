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

import { useEffect, useState } from "react";
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
import { FilteredList } from "../components/filtered-list";
import { ItemReference, Tag } from "@notesnook/core";
import { create } from "zustand";
import { VirtualizedGrouping } from "@notesnook/core";
import { ResolvedItem } from "@notesnook/common";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

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

type AddTagsDialogProps = BaseDialogProps<boolean> & { noteIds: string[] };
export const AddTagsDialog = DialogManager.register(function AddTagsDialog(
  props: AddTagsDialogProps
) {
  const { onClose, noteIds } = props;

  const [tags, setTags] = useState<VirtualizedGrouping<Tag> | undefined>(
    () => useStore.getState().tags
  );

  useEffect(() => {
    (async function () {
      if (!tags) {
        await useStore.getState().refresh();
        setTags(useStore.getState().tags);
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
  }, []);

  return (
    <Dialog
      isOpen={true}
      title={strings.addTags()}
      description={strings.addTagsDesc()}
      onClose={() => onClose(false)}
      width={450}
      positiveButton={{
        text: strings.done(),
        onClick: async () => {
          for (const id of noteIds) {
            for (const item of useSelectionStore.getState().selected) {
              const tagRef: ItemReference = { type: "tag", id: item.id };
              const noteRef: ItemReference = { id, type: "note" };
              if (item.op === "add") await db.relations.add(tagRef, noteRef);
              else await db.relations.unlink(tagRef, noteRef);
            }
          }
          await store.get().refresh();
          await notestore.get().refresh();
          onClose(true);
        }
      }}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => onClose(false)
      }}
    >
      {tags && (
        <FilteredList
          getItemKey={(index) => tags.key(index)}
          mode="fixed"
          estimatedSize={30}
          items={tags.placeholders}
          sx={{ mt: 2 }}
          itemGap={5}
          placeholders={{
            empty: strings.addATag(),
            filter: strings.searchForTags()
          }}
          filter={async (query) => {
            setTags(
              query
                ? await db.lookup.tags(query).sorted()
                : useStore.getState().tags
            );
          }}
          onCreateNewItem={async (title) => {
            const tagId = await db.tags.add({ title });
            if (!tagId) return;
            await useStore.getState().refresh();
            setTags(useStore.getState().tags);
            const { selected, setSelected } = useSelectionStore.getState();
            setSelected([...selected, { id: tagId, new: true, op: "add" }]);
          }}
          renderItem={({ index }) => {
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
});

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
