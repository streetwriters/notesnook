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

import { useCallback, useEffect, useState } from "react";
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
import { Perform } from "../common/dialog-controller";
import { FilteredList } from "../components/filtered-list";

type SelectedReference = {
  id: string;
  new: boolean;
  op: "add" | "remove";
};

type Item = {
  id: string;
  type: "tag" | "header";
  title: string;
};
type Tag = Item & { noteIds: string[] };

export type AddTagsDialogProps = {
  onClose: Perform;
  noteIds: string[];
};

function AddTagsDialog(props: AddTagsDialogProps) {
  const { onClose, noteIds } = props;

  const refreshTags = useStore((store) => store.refresh);
  const tags = useStore((store) => store.tags);

  useEffect(() => {
    refreshTags();
  }, [refreshTags]);

  const [selected, setSelected] = useState<SelectedReference[]>([]);

  const getAllTags = useCallback(() => {
    refreshTags();
    return (store.get().tags as Item[]).filter((a) => a.type !== "header");
  }, [refreshTags]);

  useEffect(() => {
    if (!tags) return;

    setSelected((s) => {
      const selected = s.slice();
      for (const tag of tags as Tag[]) {
        if (tag.type === "header") continue;
        if (selected.findIndex((a) => a.id === tag.id) > -1) continue;
        if (tagHasNotes(tag, noteIds)) {
          selected.push({
            id: tag.id,
            op: "add",
            new: false
          });
        }
      }
      return selected;
    });
  }, [noteIds, tags, setSelected]);

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
            for (const item of selected) {
              if (item.op === "add") await db.notes?.note(id).tag(item.id);
              else await db.notes?.note(id).untag(item.id);
            }
          }
          notestore.refresh();
          onClose(true);
        }
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => onClose(false)
      }}
    >
      <Flex
        mt={1}
        sx={{ overflowY: "hidden", flexDirection: "column" }}
        data-test-id="tag-list"
      >
        <FilteredList
          items={getAllTags}
          placeholders={{
            empty: "Add a new tag",
            filter: "Search or add a new tag"
          }}
          filter={(tags, query) => db.lookup?.tags(tags, query) || []}
          onCreateNewItem={async (title) => {
            const tag = await db.tags?.add(title);
            setSelected((selected) => [
              ...selected,
              { id: tag.id, new: true, op: "add" }
            ]);
          }}
          renderItem={(tag, _index) => {
            const selectedTag = selected.find((item) => item.id === tag.id);
            return (
              <TagItem
                key={tag.id}
                tag={tag}
                selected={selectedTag ? selectedTag.op : false}
                onSelect={() => {
                  setSelected((selected) => {
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
                    return copy;
                  });
                }}
              />
            );
          }}
        />
      </Flex>
    </Dialog>
  );
}

function TagItem(props: {
  tag: Item;
  selected: boolean | SelectedReference["op"];
  onSelect: () => void;
}) {
  const { tag, selected, onSelect } = props;

  return (
    <Flex
      as="li"
      data-test-id="tag"
      sx={{
        cursor: "pointer",
        justifyContent: "space-between",
        alignItems: "center",
        bg: "bgSecondary",
        borderRadius: "default",
        p: 1,
        background: "bgSecondary"
      }}
      onClick={onSelect}
    >
      <Flex sx={{ alignItems: "center" }}>
        <SelectedCheck size={20} selected={selected} />
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

function SelectedCheck({
  selected,
  size = 20
}: {
  selected: SelectedReference["op"] | boolean;
  size?: number;
}) {
  return selected === "add" ? (
    <CheckCircleOutline size={size} sx={{ mr: 1 }} color="primary" />
  ) : selected === "remove" ? (
    <CheckRemove size={size} sx={{ mr: 1 }} color="error" />
  ) : (
    <CircleEmpty size={size} sx={{ mr: 1, opacity: 0.4 }} />
  );
}

function tagHasNotes(tag: Tag, noteIds: string[]) {
  return tag.noteIds.some((id) => noteIds.indexOf(id) > -1);
}
