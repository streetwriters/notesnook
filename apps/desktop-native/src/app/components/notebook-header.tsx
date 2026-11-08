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

import { Fragment, useEffect, useRef, useState } from "react";
import { formatDate } from "@notesnook/common";
import type { Notebook } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text, type UIElement } from "@ui";
import { useStore as useAppStore } from "../stores/app-store";
import { hashNavigate, navigate } from "../navigation";
import {
  CaretRight,
  LinkBreak,
  LinkSimple,
  MoreHorizontal,
  NoteCalendar,
  Notebook as NotebookIcon,
  PencilSimple
} from "./icons";
import { useStore as useNotebookStore } from "../stores/notebook-store";
import { db } from "../common/db";
import { useStore as useSettingStore } from "../stores/setting-store";
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
      testID="notebook-header"
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
          <Flex
            sx={{ flexDirection: "row", alignItems: "center", gap: "spacing3" }}
          >
            <NotebookIcon size={17} color="icon" />
            <Text
              testID="notebook-title"
              sx={{ fontSize: "md", fontWeight: 500, color: "heading" }}
            >
              {notebook.title}
            </Text>
          </Flex>
          {notebook.description && (
            <Text sx={{ fontSize: "3xs", fontWeight: 400, color: "paragraph" }}>
              {notebook.description}
            </Text>
          )}
        </Flex>
      </Flex>
      <Flex
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Flex
          sx={{ flexDirection: "row", alignItems: "center", gap: "spacing2" }}
        >
          <NoteCalendar size={13} color="icon-secondary" />
          <Text sx={{ fontSize: "3xs", color: "paragraph", lineHeight: 1.25 }}>
            {formatDate(notebook.dateEdited, { type: "date", dateFormat })}
          </Text>
          <Text sx={{ fontSize: "3xs", color: "icon-disabled" }}>•</Text>
          <Text sx={{ fontSize: "3xs", color: "paragraph" }}>
            {strings.notes(totalNotes || 0)}
          </Text>
        </Flex>
        <Flex
          sx={{ flexDirection: "row", alignItems: "center", gap: "spacing4" }}
        >
          <Button
            variant="icon"
            sx={{ p: 0 }}
            title={
              isShortcut ? strings.removeShortcut() : strings.createShortcut()
            }
            onPress={() => addToShortcuts(notebook)}
          >
            {isShortcut ? <LinkBreak size={15} /> : <LinkSimple size={15} />}
          </Button>
          <Button
            variant="icon"
            sx={{ p: 0 }}
            title={strings.editNotebook()}
            onPress={() => hashNavigate(`/notebooks/${notebook.id}/edit`)}
          >
            <PencilSimple size={15} />
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}

function NotebookCrumbs(props: { notebook: Notebook }) {
  const moreCrumbsRef = useRef<UIElement>(null);
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
    <Flex sx={{ flexDirection: "row", alignItems: "center" }}>
      <CrumbText
        onPress={() => navigateCrumb(crumbs[0]?.id)}
        text={crumbs[0]?.title}
      />
      <CaretRight color="icon-secondary" sx={{ mx: "spacing2" }} size={11} />
      {crumbs.length > 3 && (
        <Fragment>
          <Button
            ref={moreCrumbsRef}
            variant="icon"
            sx={{ p: 0, flexShrink: 0 }}
            onPress={() => {
              moreCrumbsRef.current?.measureInWindow((x, y, width, height) =>
                Menu.openMenu(
                  crumbs
                    .slice(1, -2)
                    .reverse()
                    .map((c) => ({
                      type: "button" as const,
                      title: c.title,
                      key: c.id,
                      iconComponent: NotebookIcon,
                      onClick: () => navigateCrumb(c.id)
                    })),
                  { position: { x, y, width, height } }
                )
              );
            }}
          >
            <MoreHorizontal size={14} color="icon-secondary" />
          </Button>
          <CaretRight
            sx={{ color: "icon-secondary", mx: "spacing2" }}
            size={11}
          />
        </Fragment>
      )}
      {crumbs.slice(crumbs.length > 2 ? -2 : -1).map((crumb, index, array) => (
        <Fragment key={crumb.id}>
          <CrumbText
            onPress={() => navigateCrumb(crumb.id)}
            text={crumb.title}
          />
          {index === array.length - 1 ? null : (
            <CaretRight
              sx={{ color: "icon-secondary", mx: "spacing2" }}
              size={11}
            />
          )}
        </Fragment>
      ))}
    </Flex>
  );
}

function CrumbText(props: { text: string; onPress: () => void }) {
  return (
    <Text
      sx={{
        fontSize: "3xs",
        color: "paragraph-secondary",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        overflow: "hidden",
        cursor: "pointer",
        ":hover": { color: "paragraph" }
      }}
      onPress={props.onPress}
    >
      {props.text}
    </Text>
  );
}

function navigateCrumb(notebookId: string) {
  navigate(`/notebooks/${notebookId}`);
}
