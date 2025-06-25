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
import Field from "../components/field";
import Dialog from "../components/dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

export type PromptDialogProps = BaseDialogProps<undefined | string> & {
  title: string;
  description?: string;
  defaultValue?: string;
};

export const PromptDialog = DialogManager.register(function PromptDialog(
  props: PromptDialogProps
) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.description}
      onClose={() => props.onClose(props.defaultValue)}
      positiveButton={{
        text: strings.submit(),
        onClick: () => props.onClose(inputRef.current?.value || "")
      }}
      negativeButton={{
        text: strings.cancel(),
        onClick: () => props.onClose(props.defaultValue)
      }}
    >
      <Field
        inputRef={inputRef}
        defaultValue={props.defaultValue}
        autoFocus
        onKeyUp={(e) => {
          if (e.key == "Enter") props.onClose(inputRef.current?.value || "");
        }}
      />
    </Dialog>
  );
});
