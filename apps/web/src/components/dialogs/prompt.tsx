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
import { Perform } from "../../common/dialog-controller";
import Field from "../field";
import Dialog from "./dialog";

export type PromptDialogProps = {
  onClose: Perform;
  title: string;
  onSave: (text: string) => void;
  description?: string;
  defaultValue?: string;
};

export default function Prompt(props: PromptDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.description}
      onClose={() => props.onClose(false)}
      positiveButton={{
        text: "Done",
        onClick: () => props.onSave(inputRef.current?.value || "")
      }}
      negativeButton={{ text: "Cancel", onClick: () => props.onClose(false) }}
    >
      <Field inputRef={inputRef} defaultValue={props.defaultValue} autoFocus />
    </Dialog>
  );
}
