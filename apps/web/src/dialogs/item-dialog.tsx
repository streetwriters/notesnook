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

import { Box } from "@theme-ui/components";
import Dialog from "../components/dialog";
import Field from "../components/field";
import { useState } from "react";
import { ErrorText } from "../components/error-text";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { useStore as useTagStore } from "../stores/tag-store";
import { useStore as useNoteStore } from "../stores/note-store";
import { useStore as useAppStore } from "../stores/app-store";
import { Color, Tag } from "@notesnook/core";

type ItemDialogProps = BaseDialogProps<false | string> & {
  title: string;
  subtitle?: string;
  defaultValue?: string;
};
export const ItemDialog = DialogManager.register(function ItemDialog(
  props: ItemDialogProps
) {
  const [error, setError] = useState<Error>();

  return (
    <Dialog
      testId="item-dialog"
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      positiveButton={{
        form: "itemForm",
        type: "submit",
        text: props.title
      }}
      onClose={() => props.onClose(false)}
      negativeButton={{ text: "Cancel", onClick: () => props.onClose(false) }}
    >
      <Box
        as="form"
        id="itemForm"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(undefined);
          const formData = new FormData(e.target as HTMLFormElement);
          const title = formData.get("title");
          if (!title) return;
          try {
            await props.onClose(title as string);
          } catch (e) {
            if (e instanceof Error) {
              setError(e);
            }
          }
        }}
      >
        <Field
          required
          label="Title"
          id="title"
          name="title"
          autoFocus
          data-test-id="title-input"
          defaultValue={props.defaultValue}
        />
        <ErrorText error={error?.message} />
      </Box>
    </Dialog>
  );
});

export const CreateTagDialog = {
  show: () =>
    ItemDialog.show({
      title: "Create tag",
      subtitle: "You can create as many tags as you want."
    }).then(async (title) => {
      if (!title) return;
      await db.tags.add({ title });
      showToast("success", "Tag created!");
      useTagStore.getState().refresh();
    })
};

export const EditTagDialog = {
  show: (tag: Tag) =>
    ItemDialog.show({
      title: "Edit tag",
      subtitle: `You are editing #${tag.title}.`,
      defaultValue: tag.title
    }).then(async (title) => {
      if (!title) return;
      await db.tags.add({ id: tag.id, title });
      showToast("success", "Tag edited!");
      await useTagStore.getState().refresh();
      await useNoteStore.getState().refresh();
      await useAppStore.getState().refreshNavItems();
    })
};

export const RenameColorDialog = {
  show: (color: Color) =>
    ItemDialog.show({
      title: "Rename color",
      subtitle: `You are renaming color ${color.title}.`,
      defaultValue: color.title
    }).then(async (title) => {
      if (!title) return;
      await db.colors.add({ id: color.id, title });
      showToast("success", "Color renamed!");
      useAppStore.getState().refreshNavItems();
    })
};
