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

type TagPickerProps = {
  selectedTags: string[];
  onSelected: (tags: string[]) => void;
};
export const TagPicker = (props: TagPickerProps) => {
  const { onSelected } = props;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    props.selectedTags || []
  );

  const close = () => {
    setModalVisible(false);
  };

  const open = () => {
    setSelectedTags(props.selectedTags || []);
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
        {props.selectedTags.length
          ? props.selectedTags.map((tag) => (
              <InlineTag
                key={tag}
                icon={Icons.tag}
                title={tag}
                onClick={() => {
                  setSelectedTags((items) => {
                    const copy = items.slice();
                    const index = copy.indexOf(tag);
                    if (index > -1) copy.splice(index, 1);
                    onSelected(copy);
                    return copy;
                  });
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
                setSelectedTags((items) => {
                  const copy = items.slice();
                  const index = copy.indexOf(tag.title);
                  if (index > -1) {
                    copy.splice(index, 1);
                  } else {
                    copy.push(tag.title);
                  }
                  return copy;
                });
              }}
              isSelected={selectedTags.indexOf(tag.title) > -1}
            />
          )}
        />
      </Picker>
    </>
  );
};
