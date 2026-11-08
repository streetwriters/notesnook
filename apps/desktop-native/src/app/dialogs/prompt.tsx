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

import { useRef } from "react";
import { Dialog } from "@ui";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { Field } from "./components/field";

export type PromptDialogProps = BaseDialogProps<undefined | string> & {
  title: string;
  description?: string;
  defaultValue?: string;
  label?: string;
};

export const PromptDialog = DialogManager.register(function PromptDialog(
  props: PromptDialogProps
) {
  const value = useRef(props.defaultValue || "");
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.description}
      onClose={() => props.onClose(props.defaultValue)}
      positiveButton={{
        text: strings.submit(),
        onClick: () => props.onClose(value.current)
      }}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => props.onClose(props.defaultValue)
      }}
    >
      <Field
        label={props.label}
        placeholder={props.label}
        defaultValue={props.defaultValue}
        autoFocus
        onChangeText={(text) => (value.current = text)}
        onSubmit={(text) => props.onClose(text || "")}
        sx={{ mt: "spacing6", mb: "spacing7" }}
      />
    </Dialog>
  );
});
