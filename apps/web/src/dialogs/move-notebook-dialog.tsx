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
  CheckCircleOutline,
  CheckIntermediate,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleEmpty,
  Plus
} from "../components/icons";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../components/virtualized-tree";
import { store as notebookStore, useStore } from "../stores/notebook-store";
import { AddNotebookDialog } from "./add-notebook-dialog";

type MoveNotebookDialogProps = BaseDialogProps<boolean> & {
  notebookId: string;
};
type NotebookReference = {
  id: string;
  new: boolean;
};

export const MoveNotebookDialog = DialogManager.register(
  function MoveNotebookDialog({
    onClose,
    notebookId
  }: MoveNotebookDialogProps) {
    const [selected, setSelected] = useState<NotebookReference | null>(null);
    const refreshNotebooks = useStore((store) => store.refresh);
    const treeRef = useRef<VirtualizedTreeHandle<Notebook>>(null);
    const [notebooks, setNotebooks] = useState<string[]>([]);

    useEffect(() => {
      db.notebooks.roots
        .ids(db.settings.getGroupOptions("notebooks"))
        .then((ids) => setNotebooks(ids));
    }, []);

    useEffect(() => {
      (async function () {
        const relation = await db.relations
          .to(
            {
              id: notebookId,
              type: "notebook"
            },
            "notebook"
          )
          .get();
        const parentNotebookId = relation[0]?.fromId;
        if (selected === null && parentNotebookId) {
          setSelected({
            id: parentNotebookId,
            new: false
          });
        }
      })();
    }, [notebookId, refreshNotebooks, setSelected]);

    useEffect(() => {
      treeRef.current?.refresh();
    }, [notebooks]);

    const _onClose = useCallback(
      (result: boolean) => {
        setSelected(null);
        onClose(result);
      },
      [setSelected, onClose]
    );

    return (
      <Dialog
        testId="move-note-dialog"
        isOpen={true}
        title={strings.selectNotebooks()}
        description={"Select parent notebook to move to"}
        onClose={() => _onClose(false)}
        width={500}
        noScroll
        positiveButton={{
          text: strings.done(),
          onClick: async () => {
            const relation = await db.relations
              .to(
                {
                  id: notebookId,
                  type: "notebook"
                },
                "notebook"
              )
              .get();
            const parentNotebookId = relation[0]?.fromId;
            if (parentNotebookId) {
              await db.relations.unlink(
                {
                  type: "notebook",
                  id: parentNotebookId
                },
                {
                  type: "notebook",
                  id: notebookId
                }
              );
            }
            if (selected) {
              await db.relations.add(
                {
                  type: "notebook",
                  id: selected.id
                },
                {
                  type: "notebook",
                  id: notebookId
                }
              );
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
                  const nodes: TreeNode<Notebook>[] = [];
                  if (id === "root") {
                    for (const id of notebooks) {
                      if (id === notebookId) continue;
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
                    if (notebook.id === notebookId) continue;
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
                    disabled={item.id === notebookId}
                    isSelected={item.id === selected?.id}
                    setSelected={setSelected}
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

function calculateIndentation(
  expandable: boolean,
  depth: number,
  base: number
) {
  if (expandable && depth > 0) return depth * 7 + base;
  else if (depth === 0) return 0;
  else return depth * 12 + base;
}
function NotebookItem(props: {
  notebook: Notebook;
  isExpanded: boolean;
  isExpandable: boolean;
  toggle: () => void;
  depth: number;
  onCreateItem: () => void;
  isSelected: boolean;
  disabled: boolean;
  setSelected: (selected: NotebookReference | null) => void;
}) {
  const {
    notebook,
    isExpanded,
    toggle,
    depth,
    isExpandable,
    onCreateItem,
    isSelected,
    disabled,
    setSelected
  } = props;

  const check: React.MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (disabled) return;
      e.stopPropagation();
      e.preventDefault();

      if (isSelected) {
        setSelected(null);
        return;
      }

      setSelected({
        id: notebook.id,
        new: false
      });
    },
    [notebook, setSelected, disabled]
  );

  return (
    <Flex
      as="li"
      data-test-id="notebook"
      sx={{
        cursor: "pointer",
        justifyContent: "space-between",
        alignItems: "center",
        bg: depth === 0 ? "var(--background-secondary)" : "transparent",
        borderRadius: "default",
        p: depth === 0 ? 1 : 0,
        height: depth === 0 ? "30px" : "auto",
        ml: `${calculateIndentation(isExpandable, depth, 5)}px`,
        mb: depth === 0 ? 1 : 2
      }}
      onClick={(e) => {
        if (!isExpandable) {
          check(e);
          return;
        }
        e.stopPropagation();
        e.preventDefault();
        toggle();
      }}
    >
      <Flex sx={{ alignItems: "center" }}>
        {isExpandable ? (
          isExpanded ? (
            <ChevronDown
              data-test-id="collapse-notebook"
              size={20}
              sx={{ height: "20px" }}
            />
          ) : (
            <ChevronRight
              data-test-id="expand-notebook"
              size={20}
              sx={{ height: "20px" }}
            />
          )
        ) : null}
        <SelectedCheck
          type={isSelected ? "selected" : "none"}
          onClick={check}
        />
        <Text
          className="title"
          data-test-id="notebook-title"
          variant="subtitle"
          sx={{ fontWeight: "body", opacity: disabled ? 0.4 : 1 }}
        >
          {notebook.title}
        </Text>
      </Flex>
      <Flex data-test-id="notebook-tools" sx={{ alignItems: "center" }}>
        {isSelected ? <Circle size={8} color="accent" sx={{ mr: 1 }} /> : null}
        <Button
          variant="secondary"
          data-test-id="add-sub-notebook"
          sx={{ p: "small" }}
        >
          <Plus
            size={18}
            title={strings.newNotebook()}
            onClick={async (e) => {
              e.stopPropagation();
              await AddNotebookDialog.show({ parentId: notebook.id });
              onCreateItem();
            }}
          />
        </Button>
      </Flex>
    </Flex>
  );
}

function SelectedCheck({
  type,
  onClick
}: {
  type: "selected" | "intermediate" | "none" | "disabled";
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}) {
  switch (type) {
    case "selected":
      return (
        <CheckCircleOutline
          size={20}
          sx={{ mr: 1 }}
          color="accent"
          onClick={onClick}
        />
      );
    case "intermediate":
      return (
        <CheckIntermediate
          size={20}
          sx={{ mr: 1 }}
          color="var(--accent-secondary)"
          onClick={onClick}
        />
      );
    case "none":
      return (
        <CircleEmpty size={20} sx={{ mr: 1, opacity: 0.4 }} onClick={onClick} />
      );
    case "disabled":
      return (
        <CircleEmpty
          size={20}
          sx={{ mr: 1, opacity: 0.4 }}
          color="var(--background-secondary)"
        />
      );
  }
}
