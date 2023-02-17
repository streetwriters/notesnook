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
import { Button, Flex, Text } from "@theme-ui/components";
import { FilteredList } from "../filtered-list";
import { ItemReference } from "../../common/bridge";
import { Icon } from "../icons/icon";
import { Icons } from "../icons";
import { useAppStore } from "../../stores/app-store";
import { Picker } from "../picker";

type NotePickerProps = {
  selectedNote?: ItemReference;
  onSelected: (note?: ItemReference) => void;
};
export const NotePicker = (props: NotePickerProps) => {
  const { selectedNote, onSelected } = props;

  const [modalVisible, setModalVisible] = useState(false);
  const notes = useAppStore((s) => s.notes);

  const close = () => {
    setModalVisible(false);
  };
  const open = () => setModalVisible(true);

  return (
    <>
      <Flex sx={{ alignItems: "center" }}>
        <Button
          variant="tool"
          onClick={open}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flex: 1,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            height: 33
          }}
          title={
            selectedNote
              ? `Append to ${selectedNote?.title}`
              : `Select a note to append to`
          }
        >
          <Text
            variant="text"
            sx={{
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden"
            }}
          >
            {selectedNote
              ? `Append to "${selectedNote?.title}"`
              : `Select a note to append to`}
          </Text>
          <Icon path={Icons.chevronDown} size={18} />
        </Button>
        {selectedNote && (
          <Button
            variant="tool"
            onClick={() => onSelected(undefined)}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              height: 33
            }}
            title={"Clear selection"}
          >
            <Icon path={Icons.close} size={16} />
          </Button>
        )}
      </Flex>

      <Picker onClose={close} isOpen={modalVisible}>
        <FilteredList
          getAll={() => notes}
          filter={(items, query) =>
            items.filter((i) => i.title.toLowerCase().indexOf(query) > -1)
          }
          itemName="note"
          placeholder={"Search for a note"}
          refreshItems={() => notes}
          renderItem={(note) => (
            <Note
              note={note}
              onSelected={() => {
                onSelected(note);
                close();
              }}
            />
          )}
        />
      </Picker>
    </>
  );
};

function Note({
  note,
  onSelected
}: {
  note: ItemReference;
  onSelected: () => void;
}) {
  return (
    <Button onClick={onSelected} variant="list" sx={{ py: "7px" }}>
      <Text variant="body">{note.title}</Text>
    </Button>
  );
}
