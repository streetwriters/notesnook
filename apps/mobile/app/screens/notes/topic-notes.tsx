import { groupArray } from "@notesnook/core/utils/grouping";
import React from "react";
import NotesPage, { PLACEHOLDER_DATA } from ".";
import { db } from "../../common/database";
import { MoveNotes } from "../../components/sheets/move-notes/movenote";
import { eSendEvent } from "../../services/event-manager";
import Navigation, {
  NavigationProps,
  NotesScreenParams
} from "../../services/navigation";
import { eOpenAddTopicDialog } from "../../utils/events";
import { TopicType } from "../../utils/types";
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
      MoveNotes.present(db.notebooks?.notebook(item.notebookId).data, item);
    }
  }
];

export const TopicNotes = ({
  navigation,
  route
}: NavigationProps<"TopicNotes">) => {
  return (
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
  );
};

TopicNotes.get = (params: NotesScreenParams, grouped = true) => {
  //@ts-ignore
  const { id, notebookId } = params.item;
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
