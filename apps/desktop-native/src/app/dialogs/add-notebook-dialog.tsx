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

import { useRef, useCallback } from "react";
import { Dialog, Flex } from "@ui";
import { Notebook } from "@notesnook/core";
import { showToast } from "../utils/toast";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as appStore } from "../stores/app-store";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { checkFeature, truncateString } from "../common";
import { Field } from "./components/field";

type AddNotebookDialogProps = BaseDialogProps<boolean> & {
  parentId?: string;
  edit?: boolean;
  notebook?: Notebook;
};

export const AddNotebookDialog = DialogManager.register(
  function AddNotebookDialog(props: AddNotebookDialogProps) {
    const { notebook, onClose, parentId } = props;
    const title = useRef<string>(notebook?.title || "");
    const description = useRef<string>(notebook?.description || "");

    const onSubmit = useCallback(async () => {
      if (!title.current.trim())
        return showToast("error", strings.titleIsRequired());

      const id = await db.notebooks.add({
        id: props.notebook?.id,
        title: title.current,
        description: description.current
      });
      if (!id) return;

      if (parentId) {
        await db.relations.add(
          { type: "notebook", id: parentId },
          { type: "notebook", id }
        );
      }

      await notebookStore.refresh();
      await noteStore.refresh();
      await appStore.refreshNavItems();

      showToast(
        "success",
        props.edit
          ? strings.actions.edited.notebook(1)
          : strings.actions.created.notebook(1)
      );
      onClose(true);
    }, [props.notebook?.id, props.edit, onClose, parentId]);
    return (
      <Dialog
        testID="add-notebook-dialog"
        isOpen={true}
        title={props.edit ? strings.editNotebook() : strings.newNotebook()}
        description={
          props.edit && notebook?.title
            ? strings.editNotebookDesc(truncateString(notebook.title))
            : strings.newNotebookDesc()
        }
        onClose={() => onClose(false)}
        positiveButton={{
          text: props.edit ? strings.save() : strings.submit(),
          onClick: onSubmit
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => onClose(false)
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            mt: "spacing6",
            mb: "spacing7",
            gap: "spacing4"
          }}
        >
          <Field
            defaultValue={title.current}
            testID="title-input"
            autoFocus
            required
            label={strings.title()}
            placeholder={strings.enterNotebookTitle()}
            id="title"
            onChangeText={(text) => (title.current = text)}
            onSubmit={() => onSubmit()}
          />
          <Field
            testID="description-input"
            label={`${strings.description()} (${strings.optional()})`}
            placeholder={strings.enterNotebookDescription()}
            id="description"
            onChangeText={(text) => (description.current = text)}
            defaultValue={description.current}
          />
        </Flex>
      </Dialog>
    );
  },
  {
    onBeforeOpen: (props) => (props.edit ? true : checkFeature("notebooks"))
  }
);

type EditNotebookDialogProps = { notebookId: string };
export const EditNotebookDialog = {
  show: async (props: EditNotebookDialogProps) => {
    const notebook = await db.notebooks.notebook(props.notebookId);
    if (!notebook) return;
    return AddNotebookDialog.show({ edit: true, notebook });
  }
};
