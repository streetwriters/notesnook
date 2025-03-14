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
import { useStore as useAppStore } from "../stores/app-store";
import { hashNavigate, navigate } from "../navigation";
import { Button, Flex, Text } from "@theme-ui/components";
import {
  ChevronRight,
  Edit,
  MoreHorizontal,
  Notebook2,
  RemoveShortcutLink,
  ShortcutLink
} from "./icons";
import { useStore as useNotebookStore } from "../stores/notebook-store";
import { db } from "../common/db";
import { getFormattedDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { Notebook } from "@notesnook/core";
import { TITLE_BAR_HEIGHT } from "./title-bar";
import { Menu } from "../hooks/use-menu";

export function NotebookHeader(props: {
  notebook: Notebook;
  totalNotes?: number;
}) {
  const notebooks = useNotebookStore((store) => store.notebooks);
  const [notebook, setNotebook] = useState<Notebook | undefined>(
    props.notebook
  );
  const [totalNotes, setTotalNotes] = useState(props.totalNotes);
  const [isShortcut, setIsShortcut] = useState(false);
  const shortcuts = useAppStore((store) => store.shortcuts);
  const addToShortcuts = useAppStore((store) => store.addToShortcuts);

  useEffect(() => {
    setIsShortcut(shortcuts.findIndex((p) => p.id === props.notebook.id) > -1);
  }, [shortcuts, props.notebook.id]);

  useEffect(() => {
    (async function () {
      setNotebook(await db.notebooks.notebook(props.notebook.id));
    })();
  }, [notebooks, props.notebook]);

  useEffect(() => {
    if (props.totalNotes === undefined)
      db.relations
        .from(props.notebook, "note")
        .count()
        .then((count) => setTotalNotes(count));
    else setTotalNotes(props.totalNotes);
  }, [props.notebook, props.totalNotes]);

  if (!notebook) return null;
  const { title, description, dateEdited } = notebook;

  return (
    <Flex
      data-test-id="notebook-header"
      sx={{
        flexDirection: "column",
        p: 1,
        pb: 4,
        bg: "var(--background-secondary)",
        borderBottom: "1px solid var(--border)"
      }}
    >
      <NotebookCrumbs notebook={notebook} />
      <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Flex sx={{ alignItems: "center", gap: 2 }}>
          <Text variant="subBody">{getFormattedDate(dateEdited, "date")}</Text>
          <Text variant="subBody">{strings.notes(totalNotes || 0)}</Text>
        </Flex>
        <Flex sx={{ alignItems: "center", gap: 1 }}>
          <Button
            variant="secondary"
            sx={{
              borderRadius: 100,
              p: 1
            }}
            title={
              isShortcut ? strings.removeShortcut() : strings.createShortcut()
            }
            onClick={() => addToShortcuts(notebook)}
          >
            {isShortcut ? (
              <RemoveShortcutLink size={16} />
            ) : (
              <ShortcutLink size={14} />
            )}
          </Button>
          <Button
            variant="secondary"
            sx={{
              borderRadius: 100,
              p: 1
            }}
            title={strings.editNotebook()}
            onClick={() => hashNavigate(`/notebooks/${notebook.id}/edit`)}
          >
            <Edit size={14} />
          </Button>
        </Flex>
      </Flex>
      <Text
        data-test-id="notebook-title"
        variant="heading"
        sx={{ fontSize: "title", mt: 2 }}
      >
        {title}
      </Text>
      {description && (
        <Text variant="body" sx={{ mt: 1 }}>
          {description}
        </Text>
      )}
    </Flex>
  );
}

function NotebookCrumbs(props: { notebook: Notebook }) {
  const moreCrumbsRef = useRef<HTMLButtonElement>(null);
  const [crumbs, setCrumbs] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    (async function () {
      setCrumbs(await db.notebooks.breadcrumbs(props.notebook.id));
    })();
  }, [props.notebook]);

  if (crumbs.length < 2) {
    return null;
  }

  return (
    <Flex sx={{ alignItems: "center" }}>
      <CrumbText
        onClick={() => navigateCrumb(crumbs[0]?.id)}
        text={crumbs[0]?.title}
      />
      <ChevronRight
        as="span"
        sx={{ display: "inline", verticalAlign: "bottom" }}
        size={14}
      />
      {crumbs.length > 3 && (
        <>
          <Button
            ref={moreCrumbsRef}
            variant="icon"
            sx={{ p: 0, flexShrink: 0 }}
            onClick={() => {
              if (!moreCrumbsRef.current) return;
              Menu.openMenu(
                crumbs
                  .slice(1, -2)
                  .reverse()
                  .map((c) => ({
                    type: "button",
                    title: c.title,
                    key: c.id,
                    icon: Notebook2.path,
                    onClick: () => navigateCrumb(c.id)
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
          <ChevronRight
            sx={{ display: "inline", verticalAlign: "bottom" }}
            as="span"
            size={14}
          />
        </>
      )}
      {crumbs.slice(crumbs.length > 2 ? -2 : -1).map((crumb, index, array) => (
        <>
          <CrumbText
            onClick={() => navigateCrumb(crumb.id)}
            text={crumb.title}
          />
          {index === array.length - 1 ? null : (
            <ChevronRight
              as="span"
              sx={{ display: "inline", verticalAlign: "bottom" }}
              size={14}
            />
          )}
        </>
      ))}
    </Flex>
  );
}

function CrumbText(props: { text: string; onClick: () => void }) {
  return (
    <Text
      sx={{
        fontSize: "subBody",
        textDecoration: "none",
        color: "var(--paragraph-secondary)",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        cursor: "pointer",
        paddingBottom: "2px",
        ":hover": { color: "paragraph-hover" }
      }}
      onClick={props.onClick}
    >
      {props.text}
    </Text>
  );
}

function navigateCrumb(notebookId: string) {
  navigate(`/notebooks/${notebookId}`);
}
