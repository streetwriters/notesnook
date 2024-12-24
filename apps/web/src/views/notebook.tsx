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

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStore as useAppStore } from "../stores/app-store";
import { hashNavigate, navigate } from "../navigation";
import { Button, Flex, Text } from "@theme-ui/components";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  MoreHorizontal,
  Notebook2,
  RemoveShortcutLink,
  ShortcutLink
} from "../components/icons";
import { Plus } from "../components/icons";
import { useStore as useNotesStore } from "../stores/note-store";
import { useStore as useNotebookStore } from "../stores/notebook-store";
import { db } from "../common/db";
import { getFormattedDate, usePromise } from "@notesnook/common";
import SubNotebook from "../components/sub-notebook";
import { NotebookContext } from "../components/list-container/types";
import { Menu } from "../hooks/use-menu";
import Notes from "./notes";
import { AddNotebookDialog } from "../dialogs/add-notebook-dialog";
import { strings } from "@notesnook/intl";
import { Notebook as NotebookType } from "@notesnook/core";
import { useStore as useSelectionStore } from "../stores/selection-store";
import {
  TreeNode,
  VirtualizedTree,
  VirtualizedTreeHandle
} from "../components/virtualized-tree";
import {
  Pane,
  SplitPane,
  SplitPaneImperativeHandle
} from "../components/split-pane";

type NotebookProps = {
  rootId: string;
  notebookId?: string;
};
function Notebook(props: NotebookProps) {
  const { rootId, notebookId } = props;
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pane = useRef<SplitPaneImperativeHandle>(null);

  const context = useNotesStore((store) => store.context);
  const notes = useNotesStore((store) => store.contextNotes);

  useLayoutEffect(() => {
    const { context, setContext } = useNotesStore.getState();
    if (
      context &&
      context.type === "notebook" &&
      context.id &&
      (context.id === rootId || context.id === notebookId)
    )
      return;
    if (!notebookId && !rootId) return;

    Promise.all([
      !!notebookId && db.notebooks.exists(notebookId),
      db.notebooks.exists(rootId)
    ]).then(async (exists) => {
      if (exists.every((e) => !e)) {
        navigate(`/notebooks`, { replace: true });
        return;
      }
      const notebook = await db.notebooks.notebook(notebookId || rootId);
      setContext({
        type: "notebook",
        id: notebookId || rootId,
        item: notebook
      });
    });
  }, [rootId, notebookId]);

  if (!context || !notes || context.type !== "notebook") return null;
  return (
    <SplitPane
      ref={pane}
      direction="horizontal"
      autoSaveId={`notebook-panel-sizes:${rootId}`}
      onChange={([_, subnotebooksPane]) => {
        setIsCollapsed((isCollapsed) => {
          if (subnotebooksPane <= 34 && !isCollapsed) return true;
          else if (subnotebooksPane >= 35 && isCollapsed) return false;
          return isCollapsed;
        });
      }}
    >
      <Pane id="notes-pane" style={{ display: "flex" }}>
        <Notes
          header={
            <NotebookHeader
              key={context.id}
              rootId={rootId}
              context={context}
            />
          }
        />
      </Pane>
    </SplitPane>
  );
}
export default Notebook;

function NotebookHeader({
  rootId,
  context
}: {
  rootId: string;
  context: NotebookContext;
}) {
  const moreCrumbsRef = useRef<HTMLButtonElement>(null);
  const notebooks = useNotebookStore((store) => store.notebooks);
  const [notebook, setNotebook] = useState(context.item);
  const [totalNotes, setTotalNotes] = useState(context.totalNotes);
  const [crumbs, setCrumbs] = useState<{ id: string; title: string }[]>([]);
  const [isShortcut, setIsShortcut] = useState(false);
  const shortcuts = useAppStore((store) => store.shortcuts);
  const addToShortcuts = useAppStore((store) => store.addToShortcuts);

  useEffect(() => {
    setIsShortcut(shortcuts.findIndex((p) => p.id === context.id) > -1);
  }, [shortcuts, context.id]);

  useEffect(() => {
    (async function () {
      setNotebook(await db.notebooks.notebook(context.id));
    })();
  }, [notebooks]);

  useEffect(() => {
    (async function () {
      if (!notebook) setNotebook(await db.notebooks.notebook(context.id));
      if (totalNotes === undefined)
        setTotalNotes(
          await db.relations
            .from({ type: "notebook", id: context.id }, "note")
            .count()
        );
    })();
  }, [context.id, totalNotes, notebook]);

  useEffect(() => {
    (async function () {
      setCrumbs(await db.notebooks.breadcrumbs(context.id));
    })();
  }, [context.id]);

  if (!notebook) return null;
  const { title, description, dateEdited } = notebook;

  return (
    <Flex
      data-test-id="notebook-header"
      mx={2}
      mb={2}
      sx={{ flexDirection: "column", minWidth: 200 }}
    >
      <Flex sx={{ alignItems: "center", mb: 1 }}>
        <Button
          ref={moreCrumbsRef}
          variant="icon"
          sx={{ p: 0, flexShrink: 0 }}
          title={strings.notebooks()}
        >
          <Notebook2 size={14} />
        </Button>
        <ChevronRight as="span" size={14} />
        {crumbs.length > 2 ? (
          <>
            <Button
              ref={moreCrumbsRef}
              variant="icon"
              sx={{ p: 0, flexShrink: 0 }}
              onClick={() => {
                if (!moreCrumbsRef.current) return;
                Menu.openMenu(
                  crumbs
                    .slice(0, -2)
                    .reverse()
                    .map((c) => ({
                      type: "button",
                      title: c.title,
                      key: c.id,
                      icon: Notebook2.path,
                      onClick: () => navigateCrumb(c.id, rootId)
                    })),
                  {
                    position: {
                      target: moreCrumbsRef.current,
                      location: "below",
                      isTargetAbsolute: true,
                      align: "start",
                      yOffset: 10
                    }
                  }
                );
              }}
            >
              <MoreHorizontal size={14} />
            </Button>
            <ChevronRight as="span" size={14} />
          </>
        ) : null}
        <Text
          as="p"
          sx={{
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden"
          }}
        >
          {crumbs.slice(-2).map((crumb, index, array) => (
            <>
              <Text
                as="span"
                sx={{
                  fontSize: "subBody",
                  textDecoration: "none",
                  color: "var(--paragraph-secondary)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  cursor: "pointer",
                  ":hover": { color: "paragraph-hover" }
                }}
                onClick={() => navigateCrumb(crumb.id, rootId)}
              >
                {crumb.title}
              </Text>
              {index === array.length - 1 ? null : (
                <ChevronRight
                  as="span"
                  sx={{ display: "inline", verticalAlign: "middle" }}
                  size={14}
                />
              )}
            </>
          ))}
        </Text>
      </Flex>
      <Text variant="subBody">{getFormattedDate(dateEdited, "date")}</Text>
      <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Text
          data-test-id="notebook-title"
          variant="heading"
          sx={{ fontSize: "subheading" }}
        >
          {title}
        </Text>
        <Flex>
          <Button
            variant="secondary"
            sx={{ borderRadius: 100, width: 30, height: 30 }}
            mr={1}
            p={0}
            title={
              isShortcut ? strings.removeShortcut() : strings.createShortcut()
            }
            onClick={() => addToShortcuts(notebook)}
          >
            {isShortcut ? (
              <RemoveShortcutLink size={16} />
            ) : (
              <ShortcutLink size={16} />
            )}
          </Button>
          <Button
            variant="secondary"
            sx={{ borderRadius: 100, width: 30, height: 30 }}
            p={0}
            title={strings.editNotebook()}
            onClick={() => hashNavigate(`/notebooks/${notebook.id}/edit`)}
          >
            <Edit size={16} />
          </Button>
        </Flex>
      </Flex>

      {description && (
        <Text variant="body" sx={{ fontSize: "subtitle" }}>
          {description}
        </Text>
      )}
      <Text as="em" variant="subBody" mt={2}>
        {/* {pluralize(topics.length, "topic")},  */}
        {strings.notes(totalNotes || 0)}
      </Text>
    </Flex>
  );
}

function navigateCrumb(notebookId: string, rootId?: string) {
  if (notebookId === "notebooks") navigate("/notebooks");
  else if (rootId && notebookId === rootId) {
    navigate(`/notebooks/${rootId}`);
  } else if (rootId && notebookId) {
    navigate(`/notebooks/${rootId}/${notebookId}`);
  }
}

type SubNotebookTreeItem = {
  notebook: NotebookType;
  totalNotes: number;
};
async function fetchChildren(
  id: string,
  depth: number
): Promise<TreeNode<SubNotebookTreeItem>[]> {
  const subNotebooks = await db.relations
    .from({ type: "notebook", id }, "notebook")
    .resolve();

  const nodes: TreeNode<SubNotebookTreeItem>[] = [];
  for (const notebook of subNotebooks) {
    const hasChildren =
      (await db.relations.from(notebook, "notebook").count()) > 0;
    const totalNotes = await db.relations.from(notebook, "note").count();
    nodes.push({
      parentId: id,
      id: notebook.id,
      data: { notebook, totalNotes },
      depth: depth + 1,
      hasChildren
    });
  }

  return nodes;
}
