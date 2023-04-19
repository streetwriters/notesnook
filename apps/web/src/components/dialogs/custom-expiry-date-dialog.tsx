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

import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  Input,
  Label,
  Text
} from "@theme-ui/components";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { Perform } from "../../common/dialog-controller";
import Dialog from "./dialog";
import * as Icon from "../icons";
import dayjs from "dayjs";
import { db } from "../../common/db";

type Check = { text: string; default?: boolean };
export type ConfirmDialogProps<TCheckId extends string> = {
  title: string;
  subtitle?: string;
  onClose: Perform<false | Record<TCheckId, boolean>>;
  positiveButtonText?: string;
  negativeButtonText?: string;
  message?: string;
  checks?: Partial<Record<TCheckId, Check>>;
  note: any;
};

function ConfirmDialog<TCheckId extends string>(
  props: ConfirmDialogProps<TCheckId>
) {
  const {
    onClose,
    title,
    subtitle,
    negativeButtonText,
    positiveButtonText,
    message,
    checks,
    note
  } = props;
  const checkedItems = useRef<Record<TCheckId, boolean>>({} as any);

  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));

  return (
    <Dialog
      isOpen={true}
      title={title}
      description={subtitle}
      onClose={() => onClose(false)}
      positiveButton={
        positiveButtonText
          ? {
              text: positiveButtonText,
              onClick: async () => {
                let a = Math.floor(new Date(date).getTime() / 1000);
                await db.notes?.note(note.id).setExpiryDate(a);

                console.log("date", a, note);

                onClose(checkedItems.current);
              },
              autoFocus: !!positiveButtonText
            }
          : undefined
      }
      negativeButton={
        negativeButtonText
          ? {
              text: negativeButtonText,
              onClick: () => onClose(false)
            }
          : undefined
      }
    >
      <Flex sx={{ flexDirection: "row", justifyContent: "center", py: "5px" }}>
        <Field
          id="date"
          //label="Date"
          required
          type="date"
          data-test-id="date-input"
          min={dayjs().format("YYYY-MM-DD")}
          defaultValue={date}
          value={date}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const date = dayjs(e.target.value);
            console.log("date", date.unix());
            setDate(date.format("YYYY-MM-DD"));
          }}
        />
      </Flex>
    </Dialog>
  );
}

export default ConfirmDialog;
