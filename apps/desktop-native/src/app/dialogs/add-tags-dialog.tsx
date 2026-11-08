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
import { Dialog, Flex, Text } from "@ui";
import { db } from "../common/db";
import { useStore, store } from "../stores/tag-store";
import { store as notestore } from "../stores/note-store";
import { ItemReference, Tag, VirtualizedGrouping } from "@notesnook/core";
import { ResolvedItem } from "@notesnook/common";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import {
  RelationChange,
  selectMultiple,
  useRelationChangesStore
} from "../stores/relation-changes-store";
import { checkFeature } from "../common";
import { Tag as TagIcon } from "../components/icons";
import { FilteredList } from "./components/filtered-list";
import { SelectedCheck } from "./components/selected-check";

const TAG_ITEM_HEIGHT = 35;

type AddTagsDialogProps = BaseDialogProps<boolean> & { noteIds: string[] };
export const AddTagsDialog = DialogManager.register(function AddTagsDialog(
  props: AddTagsDialogProps
) {
  const { onClose, noteIds } = props;
  const [tags, setTags] = useState<VirtualizedGrouping<Tag> | undefined>(
    () => useStore.getState().tags
  );
  const selected = useRelationChangesStore((state) => state.selected);
  const hasChanges = selected.some((item) => item.new || item.op === "remove");

  useEffect(() => {
    (async function () {
      if (!tags) {
        await useStore.getState().refresh();
        setTags(useStore.getState().tags);
        return;
      }

      const selected: RelationChange[] = [];
      const selectedTags = await db.relations
        .to({ type: "note", ids: noteIds }, "tag")
        .get();
      selectedTags.forEach((r) => {
        if (selected.findIndex((a) => a.id === r.fromId) > -1) return;
        selected.push({ id: r.fromId, op: "add", new: false });
      });
      useRelationChangesStore.getState().setSelected(selected);
    })();
  }, []);

  return (
    <Dialog
      isOpen={true}
      title={strings.addTags()}
      description={strings.addTagsDesc()}
      onClose={() => onClose(false)}
      width={450}
      sx={{ minHeight: 434 }}
      positiveButton={{
        text: strings.done(),
        disabled: !hasChanges,
        onClick: async () => {
          const { selected } = useRelationChangesStore.getState();
          for (const id of noteIds) {
            for (const item of selected) {
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
      <Flex sx={{ my: "spacing7", flexDirection: "column" }}>
        {tags && (
          <FilteredList
            getItemKey={(index) => tags.key(index)}
            estimatedSize={TAG_ITEM_HEIGHT}
            items={tags.placeholders}
            placeholders={{
              empty: strings.addTags(),
              filter: strings.searchOrAddTags(),
              emptyList: strings.noTagsToShow()
            }}
            filter={async (query) => {
              setTags(
                query
                  ? await db.lookup.tags(query).sorted()
                  : useStore.getState().tags
              );
            }}
            onCreateNewItem={async (title) => {
              if (!(await checkFeature("tags", { type: "toast" }))) return;

              const tagId = await db.tags.add({ title });
              if (!tagId) return;
              await useStore.getState().refresh();
              setTags(useStore.getState().tags);
              const { selected, setSelected } =
                useRelationChangesStore.getState();
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
      </Flex>
    </Dialog>
  );
});

function TagItem(props: { tag: Tag }) {
  const { tag } = props;
  const selected = useRelationChangesStore((state) => state.selected);
  const setSelected = useRelationChangesStore((state) => state.setSelected);
  const selectedItem = selected.find((s) => s.id === tag.id);
  const isHighlighted = !!selectedItem && selectedItem.op !== "remove";

  function toggleSelection() {
    setSelected(selectMultiple(tag, selected));
  }

  return (
    <Flex
      testID="tag"
      onPress={toggleSelection}
      sx={{
        cursor: "pointer",
        alignItems: "center",
        height: TAG_ITEM_HEIGHT,
        bg: isHighlighted ? "background-selected" : "background",
        borderRadius: "radius1",
        p: "spacing4",
        ":hover": { bg: "hover" }
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          flexDirection: "row",
          gap: "spacing4",
          width: "100%"
        }}
      >
        <TagIcon size={15} color={isHighlighted ? "icon-selected" : "icon"} />
        <Text
          testID="tag-title"
          numberOfLines={1}
          sx={{
            flex: 1,
            minWidth: 0,
            color: isHighlighted ? "paragraph-selected" : "paragraph",
            fontSize: "sm"
          }}
        >
          {tag.title}
        </Text>
        <SelectedCheck item={tag} size={15} />
      </Flex>
    </Flex>
  );
}
