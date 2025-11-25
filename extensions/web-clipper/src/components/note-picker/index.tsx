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
import { Button, Flex, Text } from "@theme-ui/components";
import { ItemReference } from "../../common/bridge";
import { Icon } from "../icons/icon";
import { Icons } from "../icons";
import { Picker } from "../picker";
import { CheckListItem } from "../check-list-item";
import { FilteredList } from "@notesnook/web/src/components/filtered-list";
import { Note, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { db } from "../../common/db";
import { ResolvedItem } from "@notesnook/common";

type NotePickerProps = {
  selectedNote?: ItemReference;
  onSelected: (note?: ItemReference) => void;
};
export const NotePicker = (props: NotePickerProps) => {
  const { selectedNote, onSelected } = props;

  const [modalVisible, setModalVisible] = useState(false);

  const [notes, setNotes] = useState<VirtualizedGrouping<Note> | undefined>();

  useEffect(() => {
    (async function () {
      if (!notes) {
        setNotes(
          await db.notes.all.grouped(db.settings.getGroupOptions("notes"))
        );
      }
    })();
  }, []);

  console.log(notes);
  const close = () => {
    setModalVisible(false);
  };
  const open = () => setModalVisible(true);

  return (
    <>
      <Flex sx={{ alignItems: "center" }}>
        <Button
          variant="secondary"
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
            variant="body"
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
            variant="secondary"
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

      <Picker onClose={close} onDone={close} isOpen={modalVisible}>
        {notes && (
          <FilteredList
            getItemKey={(index) => notes.key(index)}
            mode="fixed"
            estimatedSize={30}
            items={notes.placeholders}
            sx={{ mt: 2 }}
            itemGap={5}
            placeholders={{
              empty: strings.notesEmpty(),
              filter: strings.searchANote()
            }}
            filter={async (query) => {
              setNotes(
                query
                  ? await db.lookup.notes(query).sorted()
                  : await db.notes.all.grouped(
                      db.settings.getGroupOptions("notes")
                    )
              );
            }}
            onCreateNewItem={async () => {}}
            renderItem={({ index }) => {
              console.log("Rendering note at index:", index);
              return (
                <ResolvedItem
                  key={index}
                  type="note"
                  items={notes}
                  index={index}
                >
                  {({ item }) => (
                    <CheckListItem
                      title={item.title}
                      onSelected={() => {
                        onSelected({ id: item.id, title: item.title });
                      }}
                      isSelected={selectedNote?.id === item.id}
                    />
                  )}
                </ResolvedItem>
              );
            }}
          />
        )}
      </Picker>
    </>
  );
};
