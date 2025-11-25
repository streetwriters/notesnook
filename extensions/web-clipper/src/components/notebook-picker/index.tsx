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
import { useEffect, useRef, useState } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { NotebookReference, SelectedReference } from "../../common/bridge";
import { Icons } from "../icons";
import { useAppStore } from "../../stores/app-store";
import { Picker } from "../picker";
import { InlineTag } from "../inline-tag";
import { CheckListItem } from "../check-list-item";
import { FilteredList } from "@notesnook/web/src/components/filtered-list";
import Field from "@notesnook/web/src/components/field";
import { strings } from "@notesnook/intl";
import { db } from "../../common/db";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "@notesnook/web/src/components/virtualized-tree";
import { NotebookItem } from "@notesnook/web/src/dialogs/move-note-dialog";
import { Notebook } from "@notesnook/core";

type NotebookPickerProps = {
  selectedItems: SelectedReference[];
  onSelected: (items?: SelectedReference[]) => void;
};
export const NotebookPicker = (props: NotebookPickerProps) => {
  const { onSelected } = props;

  const treeRef = useRef<VirtualizedTreeHandle<Notebook>>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedReference[]>(
    props.selectedItems
  );
  const [notebooks, setNotebooks] = useState<string[]>([]);

  useEffect(() => {
    db.notebooks.roots
      .ids(db.settings.getGroupOptions("notebooks"))
      .then((ids) => setNotebooks(ids));
  }, []);

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
        <Flex
          id="subnotebooks"
          variant="columnFill"
          sx={{
            height: "80vh"
          }}
        >
          <Field
            autoFocus
            sx={{ m: 0, mb: 2 }}
            styles={{
              input: { p: "7.5px" }
            }}
            placeholder={strings.searchNotebooks()}
            onChange={async (e) => {
              const query = e.target.value.trim();
              const ids = await (query
                ? db.lookup.notebooks(query).ids()
                : db.notebooks.roots.ids(
                    db.settings.getGroupOptions("notebooks")
                  ));
              setNotebooks(ids);
            }}
          />
          {notebooks.length > 0 ? (
            <>
              <VirtualizedTree
                rootId={"root"}
                itemHeight={30}
                treeRef={treeRef}
                getChildNodes={async ({ id, depth }) => {
                  const nodes: TreeNode<Notebook>[] = [];
                  if (id === "root") {
                    for (const id of notebooks) {
                      const notebook = (await db.notebooks.notebook(id))!;
                      const children = await db.relations
                        .from(notebook, "notebook")
                        .count();
                      nodes.push({
                        data: notebook,
                        depth: depth + 1,
                        hasChildren: children > 0,
                        id,
                        parentId: "root"
                      });
                    }
                    return nodes;
                  }

                  const subNotebooks = await db.relations
                    .from({ type: "notebook", id }, "notebook")
                    .resolve();

                  for (const notebook of subNotebooks) {
                    const hasChildren =
                      (await db.relations.from(notebook, "notebook").count()) >
                      0;
                    nodes.push({
                      parentId: id,
                      id: notebook.id,
                      data: notebook,
                      depth: depth + 1,
                      hasChildren
                    });
                  }

                  return nodes;
                }}
                renderItem={({ item, expanded, index, collapse, expand }) => (
                  <NotebookItem
                    notebook={item.data}
                    depth={item.depth}
                    isExpandable={item.hasChildren}
                    isExpanded={expanded}
                    toggle={expanded ? collapse : expand}
                    onCreateItem={() => {
                      treeRef.current?.refreshItem(index, item.data, {
                        expand: true
                      });
                    }}
                  />
                )}
              />
            </>
          ) : (
            <Flex
              sx={{
                my: 2,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Text variant="body">{strings.notebooksEmpty()}</Text>
              <Button
                data-test-id="add-new-notebook"
                variant="secondary"
                sx={{ mt: 2 }}
                onClick={
                  () => {}
                  // AddNotebookDialog.show({}).then((res) =>
                  //   res
                  //     ? db.notebooks.roots
                  //         .ids(db.settings.getGroupOptions("notebooks"))
                  //         .then((ids) => setNotebooks(ids))
                  //     : null
                  // )
                }
              >
                {strings.addNotebook()}
              </Button>
            </Flex>
          )}
        </Flex>
      </Picker>
    </>
  );
};
