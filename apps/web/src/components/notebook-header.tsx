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
  LinkSimple,
  MoreHorizontal,
  Notebook as NotebookIcon,
  NoteCalendar,
  PencilSimple,
  LinkBreak,
  CaretRight
} from "./icons";
import { useStore as useNotebookStore } from "../stores/notebook-store";
import { db } from "../common/db";
import { formatDate } from "@notesnook/common";
import { useStore as useSettingStore } from "../stores/setting-store";
import { strings } from "@notesnook/intl";
import { Notebook } from "@notesnook/core";
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
  const dateFormat = useSettingStore((store) => store.dateFormat);

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

  return (
    <Flex
      data-test-id="notebook-header"
      sx={{
        flexDirection: "column",
        mt: "spacing6",
        gap: "spacing7",
        px: "spacing6",
        py: "spacing4",
        bg: "background-selected"
      }}
    >
      <Flex sx={{ flexDirection: "column", gap: "spacing6" }}>
        <NotebookCrumbs notebook={notebook} />
        <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
          <Flex sx={{ alignItems: "center", gap: "spacing3" }}>
            <NotebookIcon size={17} color="icon" />
            <Text
              data-test-id="notebook-title"
              sx={{ fontSize: "md", fontWeight: 500, color: "heading" }}
            >
              {notebook.title}
            </Text>
          </Flex>
          {notebook.description && (
            <Text sx={{ fontSize: "xxs", fontWeight: 400, color: "paragraph" }}>
              {notebook.description}
            </Text>
          )}
        </Flex>
      </Flex>
      <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Flex sx={{ alignItems: "center", gap: "spacing2" }}>
          <NoteCalendar size={13} color="icon-secondary" />
          <Text
            sx={{ fontSize: "xxs", color: "paragraph", lineHeight: "125%" }}
          >
            {formatDate(notebook.dateEdited, { type: "date", dateFormat })}
          </Text>
          <Text sx={{ fontSize: "xxs", color: "icon-disabled" }}>•</Text>
          <Text sx={{ fontSize: "xxs", color: "paragraph" }}>
            {strings.notes(totalNotes || 0)}
          </Text>
        </Flex>
        <Flex sx={{ alignItems: "center", gap: "spacing4" }}>
          <Button
            variant="icon"
            sx={{ p: 0 }}
            title={
              isShortcut ? strings.removeShortcut() : strings.createShortcut()
            }
            onClick={() => addToShortcuts(notebook)}
          >
            {isShortcut ? <LinkBreak size={15} /> : <LinkSimple size={15} />}
          </Button>
          <Button
            variant="icon"
            sx={{ p: 0 }}
            title={strings.editNotebook()}
            onClick={() => hashNavigate(`/notebooks/${notebook.id}/edit`)}
          >
            <PencilSimple size={15} />
          </Button>
        </Flex>
      </Flex>
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
      <CaretRight sx={{ color: "icon-secondary", mx: "spacing2" }} size={11} />
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
                    icon: NotebookIcon.path,
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
            <MoreHorizontal size={14} color="icon-secondary" />
          </Button>
          <CaretRight
            sx={{ color: "icon-secondary", mx: "spacing2" }}
            as="span"
            size={11}
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
            <CaretRight
              as="span"
              sx={{ color: "icon-secondary", mx: "spacing2" }}
              size={11}
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
        fontSize: "xxs",
        textDecoration: "none",
        color: "paragraph-secondary",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        cursor: "pointer",
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
