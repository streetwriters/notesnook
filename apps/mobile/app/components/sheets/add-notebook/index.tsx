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
import React, { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import { DDS } from "../../../services/device-detection";
import {
  ToastManager,
  eSendEvent,
  presentSheet
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useMenuStore } from "../../../stores/use-menu-store";
import { useNotebookStore } from "../../../stores/use-notebook-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { eOnNotebookUpdated } from "../../../utils/events";
import { getParentNotebookId } from "../../../utils/notebooks";
import { AppFontSize } from "../../../utils/size";
import { Button } from "../../ui/button";
import Input from "../../ui/input";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import { MoveNotes } from "../move-notes/movenote";

export const AddNotebookSheet = ({
  notebook,
  parentNotebook,
  close,
  showMoveNotesOnComplete,
  defaultTitle
}: {
  notebook?: Notebook;
  parentNotebook?: Notebook;
  close?: (didAddNotebook: boolean) => void;
  showMoveNotesOnComplete: boolean;
  defaultTitle?: string;
}) => {
  const title = useRef(notebook?.title || defaultTitle);
  const description = useRef(notebook?.description);
  const titleInput = useRef<TextInput>(null);
  const descriptionInput = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);

  const onSaveChanges = async () => {
    if (loading) return;

    if (!title.current || title?.current.trim().length === 0) {
      ToastManager.show({
        heading: strings.enterNotebookTitle(),
        type: "error",
        context: "local"
      });
      return;
    }

    setLoading(true);

    const id = await db.notebooks.add({
      title: title.current,
      description: description.current,
      id: notebook?.id
    });

    if (parentNotebook && id) {
      await db.relations.add(parentNotebook, {
        type: "notebook",
        id: id
      });
    }

    useMenuStore.getState().setMenuPins();
    Navigation.queueRoutesForUpdate();
    useRelationStore.getState().update();
    useNotebookStore.getState().refresh();

    const parent =
      parentNotebook?.id ||
      (await getParentNotebookId(notebook?.id || (id as string)));

    eSendEvent(eOnNotebookUpdated, parent || notebook?.id);

    if (!parent) {
      useNotebookStore.getState().refresh();
    }

    if (!notebook && showMoveNotesOnComplete && id) {
      MoveNotes.present(await db.notebooks.notebook(id));
    } else {
      close?.(true);
    }
  };

  return (
    <View
      style={{
        maxHeight: DDS.isTab ? "90%" : "97%",
        borderRadius: DDS.isTab ? 5 : 0,
        paddingHorizontal: 12
      }}
    >
      <Heading size={AppFontSize.lg}>
        {notebook ? strings.editNotebook() : strings.newNotebook()}
      </Heading>

      <Seperator />

      <Input
        fwdRef={titleInput}
        testID={notesnook.ids.dialogs.notebook.inputs.title}
        onChangeText={(value) => {
          title.current = value;
        }}
        onLayout={() => {
          setImmediate(() => {
            titleInput?.current?.focus();
          });
        }}
        placeholder={strings.enterNotebookTitle()}
        onSubmit={() => {
          descriptionInput.current?.focus();
        }}
        returnKeyLabel="Next"
        returnKeyType="next"
        defaultValue={notebook ? notebook.title : title.current}
      />

      <Input
        fwdRef={descriptionInput}
        testID={notesnook.ids.dialogs.notebook.inputs.description}
        onChangeText={(value) => {
          description.current = value;
        }}
        placeholder={strings.enterNotebookDescription()}
        returnKeyLabel={strings.next()}
        returnKeyType="next"
        defaultValue={notebook ? notebook.description : ""}
      />

      <Button
        title={notebook ? strings.save() : strings.add()}
        type="accent"
        height={45}
        fontSize={AppFontSize.md}
        style={{
          paddingHorizontal: 24,
          width: "100%"
        }}
        onPress={onSaveChanges}
      />
    </View>
  );
};

AddNotebookSheet.present = (
  notebook?: Notebook,
  parentNotebook?: Notebook,
  context?: string,
  onClose?: (didAddNotebook: boolean) => void,
  showMoveNotesOnComplete = true,
  defaultTitle?: string
) => {
  presentSheet({
    context: context,
    component: (ref, close) => (
      <AddNotebookSheet
        notebook={notebook}
        parentNotebook={parentNotebook}
        close={(didAddNotebook: boolean) => {
          close?.();
          onClose?.(didAddNotebook);
        }}
        showMoveNotesOnComplete={showMoveNotesOnComplete || false}
        defaultTitle={defaultTitle}
      />
    )
  });
};
