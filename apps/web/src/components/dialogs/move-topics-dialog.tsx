/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { useCallback, useState } from "react";
import { Flex, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { db } from "../../common/db";
import Dialog from "./dialog";
import { useStore, store } from "../../stores/notebook-store";
import { Perform } from "../../common/dialog-controller";
import FilteredList, { Item } from "../filtered-list";

type MoveDialogProps = { onClose: Perform; topics: []; id: String };
type Notebook = Item;

function MoveDialog({ onClose, topics, id }: MoveDialogProps) {
  const [selected, setSelected] = useState(String);

  const refreshNotebooks = useStore((store) => store.refresh);
  const getAllNotebooks = useCallback(() => {
    refreshNotebooks();
    return (store.get().notebooks as Notebook[]).filter((a) => {
      return a.type !== "header" && a.id !== id;
    });
  }, [refreshNotebooks]);

  return (
    <Dialog
      isOpen={true}
      title={"Move topic(s)"}
      description={"You can move topics between notebooks"}
      onClose={onClose}
      width={"30%"}
      positiveButton={{
        text: "Finish",
        disabled: !selected.length,
        onClick: async () => {
          await db?.notebooks?.moveTopics(selected, topics);
          refreshNotebooks();
          onClose(true);
        }
      }}
      negativeButton={{
        text: "Cancel",
        onClick: onClose
      }}
    >
      <Flex
        mt={1}
        sx={{ overflowY: "hidden", flexDirection: "column" }}
        data-test-id="notebook-list"
      >
        <FilteredList
          placeholders={{
            empty: "Add a new notebook",
            filter: "Filter notebooks"
          }}
          items={getAllNotebooks}
          filter={(notebooks, query) =>
            db.lookup?.notebooks(notebooks, query) || []
          }
          onCreateNewItem={async (title) =>
            await db.notebooks?.add({
              title
            })
          }
          renderItem={(notebook, _index, refresh) => {
            return (
              <Flex
                sx={{
                  alignItems: "center",
                  p: "3px",
                  cursor: "pointer",
                  ":hover": { bg: "hover" },
                  justifyContent: "space-between"
                }}
                onClick={(e) => {
                  setSelected(notebook.id);
                  refresh();
                }}
              >
                <Flex>
                  {selected === notebook.id ? (
                    <Icon.Checkmark size={18} />
                  ) : (
                    <Icon.ChevronRight size={18} />
                  )}
                  <Text
                    variant={"body"}
                    sx={{ fontSize: "subtitle" }}
                    data-test-id="title"
                  >
                    {notebook.title}
                  </Text>
                </Flex>
              </Flex>
            );
          }}
        />
      </Flex>
    </Dialog>
  );
}

export default MoveDialog;
