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

import { groupArray } from "@notesnook/core/utils/grouping";
import React from "react";
import NotesPage, { PLACEHOLDER_DATA } from ".";
import { db } from "../../common/database";
import { MoveNotes } from "../../components/sheets/move-notes/movenote";
import { eSendEvent } from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import { NotesScreenParams } from "../../stores/use-navigation-store";
import { eOpenAddTopicDialog } from "../../utils/events";
import { NotebookType, TopicType } from "../../utils/types";
import { openEditor } from "./common";
const headerRightButtons = (params: NotesScreenParams) => [
  {
    title: "Edit topic",
    onPress: () => {
      const { item } = params;
      if (item.type !== "topic") return;
      eSendEvent(eOpenAddTopicDialog, {
        notebookId: item.notebookId,
        toEdit: item
      });
    }
  },
  {
    title: "Move notes",
    onPress: () => {
      const { item } = params;
      if (item?.type !== "topic") return;
      MoveNotes.present(
        db.notebooks?.notebook(item.notebookId).data as NotebookType,
        item
      );
    }
  }
];

export const TopicNotes = ({
  navigation,
  route
}: NavigationProps<"TopicNotes">) => {
  return (
    <>
      <NotesPage
        navigation={navigation}
        route={route}
        get={TopicNotes.get}
        placeholderData={PLACEHOLDER_DATA}
        onPressFloatingButton={openEditor}
        rightButtons={headerRightButtons}
        canGoBack={route.params.canGoBack}
        focusControl={true}
      />
    </>
  );
};

TopicNotes.get = (params: NotesScreenParams, grouped = true) => {
  const { id, notebookId } = params.item as TopicType;
  const notes = db.notebooks?.notebook(notebookId)?.topics.topic(id)?.all || [];
  return grouped
    ? groupArray(notes, db.settings?.getGroupOptions("notes"))
    : notes;
};

TopicNotes.navigate = (item: TopicType, canGoBack: boolean) => {
  if (!item) return;
  Navigation.navigate<"TopicNotes">(
    {
      name: "TopicNotes",
      title: item.title,
      id: item.id,
      type: "topic",
      notebookId: item.notebookId
    },
    {
      item: item,
      canGoBack,
      title: item.title
    }
  );
};
