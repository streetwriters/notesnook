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

import { Notebook } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text } from "@theme-ui/components";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";
import Field from "../components/field";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../components/virtualized-tree";
import { store as notebookStore, useStore } from "../stores/notebook-store";
import { AddNotebookDialog } from "./add-notebook-dialog";
import { NotebookItem, useSelectionStore } from "./move-note-dialog";

type MoveNotebookDialogProps = BaseDialogProps<boolean> & {
  notebook: Notebook;
};

export const MoveNotebookDialog = DialogManager.register(
  function MoveNotebookDialog({ onClose, notebook }: MoveNotebookDialogProps) {
    const setSelected = useSelectionStore((store) => store.setSelected);
    const refreshNotebooks = useStore((store) => store.refresh);
    const treeRef = useRef<VirtualizedTreeHandle<Notebook>>(null);
    const [notebooks, setNotebooks] = useState<string[]>([]);
    const notebookId = notebook.id;

    useEffect(() => {
      db.notebooks.roots
        .ids(db.settings.getGroupOptions("notebooks"))
        .then((ids) => setNotebooks(ids));
    }, []);

    useEffect(() => {
      (async function () {
        const parentNotebookId = await getParentNotebookId(notebookId);
        const selected = useSelectionStore.getState().selected[0];
        if (!selected && parentNotebookId) {
          setSelected([{ id: parentNotebookId, new: false, op: "add" }]);
        }
      })();
    }, [notebookId, refreshNotebooks, setSelected]);

    useEffect(() => {
      treeRef.current?.refresh();
    }, [notebooks]);

    const _onClose = useCallback(
      (result: boolean) => {
        setSelected([]);
        onClose(result);
      },
      [setSelected, onClose]
    );

    return (
      <Dialog
        testId="move-notebook-dialog"
        isOpen={true}
        title={`${strings.move()} ${notebook.title}`}
        description={strings.moveNotebookDesc()}
        onClose={() => _onClose(false)}
        width={500}
        noScroll
        positiveButton={{
          text: strings.done(),
          onClick: async () => {
            const { selected } = useSelectionStore.getState();
            for (const item of selected) {
              if (item.op === "remove") {
                await db.relations.unlink(
                  { type: "notebook", id: item.id },
                  { id: notebookId, type: "notebook" }
                );
              } else if (item.op === "add") {
                await db.relations.add(
                  { type: "notebook", id: item.id },
                  { id: notebookId, type: "notebook" }
                );
              }
            }
            await notebookStore.refresh();
            _onClose(true);
          }
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => _onClose(false)
        }}
      >
        <Flex
          id="subnotebooks"
          variant="columnFill"
          sx={{
            height: "80vh",
            px: 4
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
                getChildNodes={async (id, depth) => {
                  const parentNotebookId = await getParentNotebookId(
                    notebookId
                  );
                  const nodes: TreeNode<Notebook>[] = [];
                  if (id === "root") {
                    for (const id of notebooks) {
                      if (id === notebookId) continue;
                      const notebook = (await db.notebooks.notebook(id))!;
                      const childrenCount = await db.relations
                        .from(notebook, "notebook")
                        .count();
                      const isParent = parentNotebookId === notebook.id;
                      nodes.push({
                        data: notebook,
                        depth: depth + 1,
                        id,
                        parentId: "root",
                        hasChildren: isParent
                          ? childrenCount !== 1
                          : childrenCount > 0
                      });
                    }
                    return nodes;
                  }

                  const subNotebooks = await db.relations
                    .from({ type: "notebook", id }, "notebook")
                    .resolve();

                  for (const notebook of subNotebooks) {
                    if (notebook.id === notebookId) continue;

                    const childrenCount = await db.relations
                      .from(notebook, "notebook")
                      .count();
                    const isParent = parentNotebookId === notebook.id;

                    nodes.push({
                      parentId: id,
                      id: notebook.id,
                      data: notebook,
                      depth: depth + 1,
                      hasChildren: isParent
                        ? childrenCount !== 1
                        : childrenCount > 0
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
                onClick={() =>
                  AddNotebookDialog.show({}).then((res) =>
                    res
                      ? db.notebooks.roots
                          .ids(db.settings.getGroupOptions("notebooks"))
                          .then((ids) => setNotebooks(ids))
                      : null
                  )
                }
              >
                {strings.addNotebook()}
              </Button>
            </Flex>
          )}
        </Flex>
      </Dialog>
    );
  }
);

async function getParentNotebookId(notebookId: string) {
  const relation = await db.relations
    .to(
      {
        id: notebookId,
        type: "notebook"
      },
      "notebook"
    )
    .get();
  return relation[0]?.fromId;
}
