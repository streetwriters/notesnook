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
import { NotebookReference, SelectedReference } from "../../common/bridge";
import { Icons } from "../icons";
import { useAppStore } from "../../stores/app-store";
import { Picker } from "../picker";
import { InlineTag } from "../inline-tag";
import { CheckListItem } from "../check-list-item";

type NotebookPickerProps = {
  selectedItems: SelectedReference[];
  onSelected: (items?: SelectedReference[]) => void;
};
export const NotebookPicker = (props: NotebookPickerProps) => {
  const { onSelected } = props;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedReference[]>(
    props.selectedItems
  );

  const close = () => {
    setModalVisible(false);
  };
  const open = () => {
    setSelectedItems(props.selectedItems);
    setModalVisible(true);
  };

  return (
    <>
      <Flex
        sx={{
          border: "1px solid var(--border)",
          p: 1,
          gap: 1,
          borderRadius: "default",
          flexWrap: "wrap"
        }}
      >
        {props.selectedItems && props.selectedItems.length
          ? props.selectedItems.map((item) => (
              <InlineTag
                key={item.id}
                title={item.title}
                icon={Icons.notebook}
                onClick={() =>
                  setSelectedItems((items) => {
                    const copy = items.slice();
                    const index = copy.indexOf(item);
                    if (index > -1) copy.splice(index, 1);
                    onSelected(copy);
                    return copy;
                  })
                }
              />
            ))
          : null}
        <InlineTag
          title={selectedItems.length ? "Add more" : "Add to notebook"}
          icon={Icons.plus}
          iconColor="accent"
          onClick={open}
        />
      </Flex>
      <Picker
        onClose={close}
        onDone={() => {
          onSelected(selectedItems);
          close();
        }}
        isOpen={modalVisible}
      >
        <FilteredList
          getAll={() => useAppStore.getState().notebooks}
          filter={(items, query) =>
            items.filter((item) => item.title.toLowerCase().indexOf(query) > -1)
          }
          itemName="notebook"
          placeholder={"Search for a notebook"}
          refreshItems={() => useAppStore.getState().notebooks}
          renderItem={(item) => (
            <Notebook
              notebook={item}
              isSelected={
                !!selectedItems.find(
                  (n) => n.id === item.id && n.type === "notebook"
                )
              }
              onSelected={(ref) => {
                setSelectedItems((items) => {
                  const copy = items.slice();
                  const index = copy.findIndex(
                    (n) => n.id === ref.id && n.type === ref.type
                  );
                  if (index > -1) {
                    copy.splice(index, 1);
                  } else {
                    copy.push(ref);
                  }
                  return copy;
                });
              }}
            />
          )}
        />
      </Picker>
    </>
  );
};

type NotebookProps = {
  notebook: NotebookReference;
  isSelected: boolean;
  onSelected: (notebook: SelectedReference) => void;
};
function Notebook(props: NotebookProps) {
  const { notebook, isSelected, onSelected } = props;

  return (
    <Flex
      sx={{
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      <CheckListItem
        title={notebook.title}
        isSelected={isSelected}
        onSelected={() => {
          onSelected({
            id: notebook.id,
            title: notebook.title,
            type: "notebook"
          });
        }}
      />

      {/* <FilteredList
        getAll={() => notebook.topics}
        itemName="topic"
        placeholder={"Search for a topic"}
        refreshItems={() => notebook.topics}
        renderItem={(topic) => (
          <CheckListItem
            title={topic.title}
            isSelected={isTopicSelected(topic)}
            indentLevel={1}
            onSelected={() => {
              onSelected({
                id: topic.id,
                title: topic.title,
                type: "topic",
                parentId: notebook.id
              });
            }}
          />
        )}
      /> */}
    </Flex>
  );
}
