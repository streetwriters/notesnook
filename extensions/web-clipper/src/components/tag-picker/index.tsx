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
import { Icons } from "../icons";
import { Picker } from "../picker";
import { InlineTag } from "../inline-tag";
import { SelectedReference } from "../../common/bridge";
import { FilteredList } from "@notesnook/web/src/components/filtered-list";
import { Tag, VirtualizedGrouping } from "@notesnook/core";
import { db } from "../../common/db";
import { strings } from "@notesnook/intl";
import { checkFeature } from "@notesnook/web/src/common";
import {
  SelectedCheck,
  selectMultiple,
  useSelectionStore
} from "@notesnook/web/src/dialogs/move-note-dialog";
import { ResolvedItem } from "@notesnook/common";

type TagPickerProps = {
  selectedTags: SelectedReference[];
  onSelected: (tags: SelectedReference[]) => void;
};
export const TagPicker = (props: TagPickerProps) => {
  const { selectedTags, onSelected } = props;

  const [modalVisible, setModalVisible] = useState(false);
  const [tags, setTags] = useState<VirtualizedGrouping<Tag> | undefined>();

  useEffect(() => {
    (async function () {
      if (!tags) {
        setTags(await db.tags.all.grouped(db.settings.getGroupOptions("tags")));
        return;
      }

      useSelectionStore.getState().setSelected(
        selectedTags.map((t) => ({
          id: t.id,
          new: false,
          op: "add"
        }))
      );
    })();
  }, []);

  const close = () => {
    setModalVisible(false);
  };

  const open = () => {
    setModalVisible(true);
  };

  return (
    <>
      <Flex
        sx={{
          border: "2px solid var(--border)",
          p: 1,
          borderRadius: "default",
          flexWrap: "wrap",
          gap: 1
        }}
      >
        {selectedTags.length
          ? selectedTags.map((tag) => (
              <InlineTag
                key={tag.id}
                icon={Icons.tag}
                title={tag.title}
                onClick={() => {
                  const copy = selectedTags.slice();
                  const index = copy.findIndex(
                    (c) => c.type === "tag" && c.id === tag.id
                  );
                  if (index <= -1) return;
                  copy.splice(index, 1);
                  onSelected(copy);
                }}
              />
            ))
          : null}
        <InlineTag
          icon={Icons.plus}
          title={"Assign a tag"}
          iconColor="accent"
          onClick={open}
        />
      </Flex>
      <Picker
        onClose={close}
        onDone={() => {
          onSelected(selectedTags);
          close();
        }}
        isOpen={modalVisible}
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
                  : await db.tags.all.grouped(
                      db.settings.getGroupOptions("tags")
                    )
              );
            }}
            onCreateNewItem={async (title) => {
              if (!(await checkFeature("tags", { type: "toast" }))) return;

              const tagId = await db.tags.add({ title });
              if (!tagId) return;
              setTags(
                await db.tags.all.grouped(db.settings.getGroupOptions("tags"))
              );
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
      </Picker>
    </>
  );
};

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
        setSelected(selectMultiple(tag, selected));
      }}
    >
      <Flex sx={{ alignItems: "center" }}>
        <SelectedCheck size={18} item={tag} />
        <Text className="title" data-test-id="tag-title" variant="body">
          #{tag.title}
        </Text>
      </Flex>
    </Flex>
  );
}
