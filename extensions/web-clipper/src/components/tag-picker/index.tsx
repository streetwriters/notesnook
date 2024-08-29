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
import { useState } from "react";
import { Flex } from "@theme-ui/components";
import { FilteredList } from "../filtered-list";
import { Icons } from "../icons";
import { useAppStore } from "../../stores/app-store";
import { Picker } from "../picker";
import { InlineTag } from "../inline-tag";
import { CheckListItem } from "../check-list-item";
import { SelectedReference } from "../../common/bridge";

type TagPickerProps = {
  selectedTags: SelectedReference[];
  onSelected: (tags: SelectedReference[]) => void;
};
export const TagPicker = (props: TagPickerProps) => {
  const { selectedTags, onSelected } = props;

  const [modalVisible, setModalVisible] = useState(false);

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
        <FilteredList
          getAll={() => useAppStore.getState().tags}
          filter={(items, query) =>
            items.filter((item) => item.title.toLowerCase().indexOf(query) > -1)
          }
          itemName="tag"
          placeholder={"Search for a tag"}
          refreshItems={() => useAppStore.getState().tags}
          renderItem={(tag) => (
            <CheckListItem
              title={`#${tag.title}`}
              onSelected={() => {
                const copy = selectedTags.slice();
                const index = copy.findIndex(
                  (c) => c.type === "tag" && c.id === tag.id
                );
                if (index <= -1) copy.push({ ...tag, type: "tag" });
                else copy.splice(index, 1);
                onSelected(copy);
              }}
              isSelected={
                selectedTags.findIndex(
                  (s) => s.type === "tag" && s.id === tag.id
                ) > -1
              }
            />
          )}
        />
      </Picker>
    </>
  );
};
