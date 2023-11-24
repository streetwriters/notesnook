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
import { Perform } from "../common/dialog-controller";
import { store as noteStore } from "../stores/note-store";
import { store as notebookStore } from "../stores/notebook-store";
import { store as appStore } from "../stores/app-store";
import { db } from "../common/db";

type AddNotebookDialogProps = {
  parentId?: string;
  edit?: boolean;
  notebook?: Notebook;
  onClose: Perform;
};

function AddNotebookDialog(props: AddNotebookDialogProps) {
  const { notebook, onClose, parentId } = props;
  const title = useRef<string>(notebook?.title || "");
  const description = useRef<string>(notebook?.description || "");

  const onSubmit = useCallback(async () => {
    if (!title.current.trim())
      return showToast("error", "Notebook title cannot be empty.");

    const id = await db.notebooks.add({
      id: props.notebook?.id,
      title: title.current,
      description: description.current
    });
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
        ? "Notebook edited successfully!"
        : "Notebook created successfully"
    );
    onClose(true);
  }, [props.notebook?.id, props.edit, onClose, parentId]);
  return (
    <Dialog
      testId="add-notebook-dialog"
      isOpen={true}
      title={props.edit ? "Edit Notebook" : "Create a Notebook"}
      description={
        props.edit
          ? `You are editing "${notebook?.title}".`
          : "Notebooks are the best way to organize your notes."
      }
      onClose={() => onClose(false)}
      positiveButton={{
        text: props.edit ? "Save" : "Create",
        onClick: onSubmit
      }}
      negativeButton={{ text: "Cancel", onClick: () => onClose(false) }}
    >
      <Field
        defaultValue={title.current}
        data-test-id="title-input"
        autoFocus
        required
        label="Title"
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
        label="Description"
        name="description"
        id="description"
        onChange={(e) => (description.current = e.target.value)}
        defaultValue={description.current}
        helpText="Optional"
        sx={{ mt: 1 }}
      />
    </Dialog>
  );
}

export default AddNotebookDialog;
