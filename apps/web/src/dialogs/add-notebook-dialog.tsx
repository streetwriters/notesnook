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
import Dialog from "../components/dialog";
import Field from "../components/field";
import { showToast } from "../utils/toast";
import { Notebook } from "@notesnook/core";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as appStore } from "../stores/app-store";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

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
        return showToast("error", strings.allFieldsRequired());

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
        testId="add-notebook-dialog"
        isOpen={true}
        title={props.edit ? strings.editNotebook() : strings.newNotebook()}
        description={
          props.edit && notebook?.title
            ? strings.editNotebookDesc(notebook.title)
            : strings.newNotebookDesc()
        }
        onClose={() => onClose(false)}
        positiveButton={{
          text: props.edit ? strings.save() : strings.create(),
          onClick: onSubmit
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => onClose(false)
        }}
      >
        <Field
          defaultValue={title.current}
          data-test-id="title-input"
          autoFocus
          required
          label={strings.title()}
          name="title"
          id="title"
          onChange={(e) => (title.current = e.target.value)}
          onKeyUp={async (e) => {
            if (e.key === "Enter") {
              await onSubmit();
            }
          }}
        />
        <Field
          data-test-id="description-input"
          label={strings.description()}
          name="description"
          id="description"
          onChange={(e) => (description.current = e.target.value)}
          defaultValue={description.current}
          helpText={strings.optional()}
          sx={{ mt: 1 }}
        />
      </Dialog>
    );
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
