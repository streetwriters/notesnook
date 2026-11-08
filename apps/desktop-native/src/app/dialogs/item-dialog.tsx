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

import { useRef, useState } from "react";
import { Dialog, Flex } from "@ui";
import { ErrorText } from "./components/error-text";
import { Field } from "./components/field";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { db } from "../common/db";
import { showToast } from "../utils/toast";
import { useStore as useTagStore } from "../stores/tag-store";
import { useStore as useNoteStore } from "../stores/note-store";
import { useStore as useAppStore } from "../stores/app-store";
import { Color, Tag } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { checkFeature, truncateString } from "../common";

type ItemDialogProps = BaseDialogProps<false | string> & {
  title: string;
  subtitle?: string;
  defaultValue?: string;
  placeholder?: string;
};
export const ItemDialog = DialogManager.register(function ItemDialog(
  props: ItemDialogProps
) {
  const [error, setError] = useState<Error>();
  const value = useRef(props.defaultValue || "");

  const onSubmit = () => {
    setError(undefined);
    const title = value.current;
    if (!title) return;
    try {
      props.onClose(title);
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    }
  };

  return (
    <Dialog
      testID="item-dialog"
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      positiveButton={{
        text: props.title,
        onClick: onSubmit
      }}
      onClose={() => props.onClose(false)}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => props.onClose(false)
      }}
    >
      <Flex sx={{ flexDirection: "column" }}>
        <Field
          required
          label={strings.title()}
          placeholder={props.placeholder}
          id="title"
          autoFocus
          testID="title-input"
          defaultValue={props.defaultValue}
          onChangeText={(text) => (value.current = text)}
          onSubmit={onSubmit}
          sx={{ mt: "spacing6", mb: "spacing7" }}
        />
        <ErrorText error={error?.message} />
      </Flex>
    </Dialog>
  );
});

export const CreateTagDialog = {
  show: async () => {
    if (!(await checkFeature("tags"))) return;
    await ItemDialog.show({
      title: strings.addTag(),
      subtitle: strings.addTagDesc(),
      placeholder: strings.enterTitle()
    }).then(async (title) => {
      if (
        !title ||
        !(await db.tags.add({ title }).catch((e) => {
          showToast("error", e.message);
          return false;
        }))
      )
        return;

      showToast("success", strings.actions.created.tag(1));
      useTagStore.getState().refresh();
    });
  }
};

export const EditTagDialog = {
  show: (tag: Tag) =>
    ItemDialog.show({
      title: strings.doActions.edit.tag(1),
      subtitle: strings.editingTagDesc(truncateString(tag.title)),
      defaultValue: tag.title
    }).then(async (title) => {
      if (
        !title ||
        !(await db.tags.add({ id: tag.id, title }).catch((e) => {
          showToast("error", e.message);
          return false;
        }))
      )
        return;
      showToast("success", strings.actions.edited.tag(1));
      await useTagStore.getState().refresh();
      await useNoteStore.getState().refresh();
      await useAppStore.getState().refreshNavItems();
    })
};

export const RenameColorDialog = {
  show: (color: Color) =>
    ItemDialog.show({
      title: strings.renameColor(),
      subtitle: strings.renameColorDesc(truncateString(color.title)),
      defaultValue: color.title
    }).then(async (title) => {
      if (
        !title ||
        !(await db.colors.add({ id: color.id, title }).catch((e) => {
          showToast("error", e.message);
          return false;
        }))
      )
        return;
      showToast("success", strings.actions.renamed.color(1));
      useAppStore.getState().refreshNavItems();
    })
};
