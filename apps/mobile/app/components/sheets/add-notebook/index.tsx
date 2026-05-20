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
import { ToastManager, eSendEvent } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useMenuStore } from "../../../stores/use-menu-store";
import { useNotebookStore } from "../../../stores/use-notebook-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { eOnNotebookUpdated } from "../../../utils/events";
import { getParentNotebookId } from "../../../utils/notebooks";
import { useSettingStore } from "../../../stores/use-setting-store";
import DialogHeader from "../../dialog/dialog-header";
import DialogButtons from "../../dialog/dialog-buttons";
import { presentDialog } from "../../dialog/functions";
import { getElevationStyle } from "../../../utils/elevation";
import { useThemeColors } from "@notesnook/theme";
import { getContainerBorder } from "../../../utils/colors";
import { Radius, Spacing } from "../../../common/design/spacing";
import FormInput, {
  createFormRef,
  validators
} from "../../ui/input/form-input";

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
  const { colors } = useThemeColors();
  const titleInput = useRef<TextInput>(null);
  const descriptionInput = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(
    createFormRef({
      title: notebook?.title || defaultTitle || "",
      description: notebook?.description || ""
    })
  );

  const onSaveChanges = async () => {
    if (loading) return;

    if (!formRef.current?.validate()) return;

    setLoading(true);

    const values = formRef.current.getValues();

    const id = await db.notebooks.add({
      title: values.title,
      description: values.description,
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

    if (showMoveNotesOnComplete && id && !notebook?.id) {
      ToastManager.show({
        heading: strings.notebookAdded(),
        type: "success",
        context: "global",
        actionText: strings.addNotes(),
        duration: 8000,
        func: async () => {
          Navigation.navigate("MoveNotes", {
            notebook: (await db.notebooks.notebook(id)) as Notebook
          });
          ToastManager.hide();
        }
      });
    }
    close?.(true);
  };

  return (
    <View
      style={{
        ...getElevationStyle(5),
        width: DDS.isTab ? 400 : "85%",
        maxHeight: 450,
        borderRadius: Radius.LG,
        backgroundColor: colors.primary.background,
        gap: Spacing.LEVEL_4,
        paddingVertical: Spacing.LEVEL_4,
        ...getContainerBorder(colors.primary.border, 0.5),
        overflow: "hidden"
      }}
    >
      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_4
        }}
      >
        <DialogHeader
          title={notebook ? strings.editNotebook() : strings.newNotebook()}
        />

        <View
          style={{
            gap: Spacing.LEVEL_2
          }}
        >
          <FormInput
            fwdRef={titleInput}
            name="title"
            formRef={formRef}
            testID={notesnook.ids.dialogs.notebook.inputs.title}
            onLayout={() => {
              setTimeout(() => {
                titleInput?.current?.focus();
              }, 300);
            }}
            validators={[validators.required(strings.titleIsRequired())]}
            placeholder={"eg. My Notebook"}
            onSubmitEditing={() => {
              descriptionInput.current?.focus();
            }}
            label={strings.enterNotebookTitle()}
            returnKeyLabel="Next"
            returnKeyType="next"
            defaultValue={
              notebook ? notebook.title : formRef.current.getValue("title")
            }
          />

          <FormInput
            fwdRef={descriptionInput}
            name="description"
            formRef={formRef}
            testID={notesnook.ids.dialogs.notebook.inputs.description}
            label={strings.enterNotebookDescription()}
            placeholder={"eg. This is My Notebook"}
            returnKeyLabel={strings.next()}
            returnKeyType="next"
            defaultValue={notebook ? notebook.description : ""}
          />
        </View>
      </View>
      <DialogButtons
        onPressNegative={() => {
          close?.(false);
          useSettingStore.getState().setSheetKeyboardHandler(true);
        }}
        positiveTitle={notebook ? strings.save() : strings.add()}
        negativeTitle={strings.cancel()}
        onPressPositive={onSaveChanges}
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
  presentDialog({
    context: context,
    component: (close) => (
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
