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
import { store as editorstore } from "../stores/editor-store";
import { Perform } from "../common/dialog-controller";
import { FilteredList } from "../components/filtered-list";
import { ItemReference, Tag, isGroupHeader } from "@notesnook/core/dist/types";

type SelectedReference = {
  id: string;
  new: boolean;
  op: "add" | "remove";
};

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

  const getAllTags = useCallback(async () => {
    await refreshTags();
    return (store.get().tags?.ids.filter((a) => !isGroupHeader(a)) ||
      []) as string[];
  }, [refreshTags]);

  useEffect(() => {
    if (!tags) return;
    (async function () {
      const copy = selected.slice();
      for (const tag of tags.ids) {
        if (isGroupHeader(tag)) continue;
        if (copy.findIndex((a) => a.id === tag) > -1) continue;

        if (await tagHasNotes(tag, noteIds)) {
          copy.push({
            id: tag,
            op: "add",
            new: false
          });
        }
      }
      setSelected(copy);
    })();
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
              const tagRef: ItemReference = { type: "tag", id: item.id };
              const noteRef: ItemReference = { id, type: "note" };
              if (item.op === "add") await db.relations.add(tagRef, noteRef);
              else await db.relations.unlink(tagRef, noteRef);
            }
          }
          editorstore.get().refreshTags();
          store.get().refresh();
          notestore.get().refresh();
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
          filter={(tags, query) => []}
          // db.lookup.tags(tags, query) || []}
          onCreateNewItem={async (title) => {
            const tagId = await db.tags.add({ title });
            if (!tagId) return;
            setSelected((selected) => [
              ...selected,
              { id: tagId, new: true, op: "add" }
            ]);
          }}
          renderItem={(tagId, _index) => {
            const selectedTag = selected.find((item) => item.id === tagId);
            return (
              <TagItem
                key={tagId}
                id={tagId}
                resolve={(id) => tags?.item(id)}
                selected={selectedTag ? selectedTag.op : false}
                onSelect={() => {
                  setSelected((selected) => {
                    const copy = selected.slice();
                    const index = copy.findIndex((item) => item.id === tagId);
                    const isNew = copy[index] && copy[index].new;
                    if (isNew) {
                      copy.splice(index, 1);
                    } else if (index > -1) {
                      copy[index] = {
                        ...copy[index],
                        op: copy[index].op === "add" ? "remove" : "add"
                      };
                    } else {
                      copy.push({ id: tagId, new: true, op: "add" });
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
  id: string;
  resolve: (id: string) => Promise<Tag | undefined> | undefined;
  selected: boolean | SelectedReference["op"];
  onSelect: () => void;
}) {
  const { id, resolve, selected, onSelect } = props;

  const [tag, setTag] = useState<Tag>();

  useEffect(() => {
    (async function () {
      setTag(await resolve(id));
    })();
  }, [id, resolve]);

  if (!tag) return null;
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
    <CheckCircleOutline size={size} sx={{ mr: 1 }} color="accent" />
  ) : selected === "remove" ? (
    <CheckRemove size={size} sx={{ mr: 1 }} color="icon-error" />
  ) : (
    <CircleEmpty size={size} sx={{ mr: 1, opacity: 0.4 }} />
  );
}

function tagHasNotes(tagId: string, noteIds: string[]) {
  return db.relations.from({ type: "tag", id: tagId }, "note").has(...noteIds);
}
