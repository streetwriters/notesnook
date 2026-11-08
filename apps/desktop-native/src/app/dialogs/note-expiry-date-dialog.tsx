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

import { useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Dialog, Flex } from "@ui";
import { strings } from "@notesnook/intl";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { store } from "../stores/note-store";
import { showToast } from "../utils/toast";
import { DateField } from "./components/date-field";

dayjs.extend(customParseFormat);

type NoteExpiryDateDialogProps = BaseDialogProps<boolean> & {
  noteId: string;
  expiryDate?: number | null;
};

export const NoteExpiryDateDialog = DialogManager.register(
  function NoteExpiryDateDialog(props: NoteExpiryDateDialogProps) {
    const { onClose, noteId, expiryDate } = props;
    const [date, setDate] = useState(
      expiryDate ? dayjs(expiryDate) : dayjs().add(7, "day")
    );

    return (
      <Dialog
        isOpen={true}
        title={strings.setExpiry()}
        description={strings.noteExpiryDateDesc()}
        onClose={() => onClose(false)}
        width={400}
        positiveButton={{
          text: strings.done(),
          onClick: async () => {
            if (date.isBefore(dayjs())) {
              showToast("error", strings.expiryDateMustBeInTheFuture());
              return;
            }
            if (date.isAfter(dayjs().add(1, "year"))) {
              showToast(
                "error",
                strings.expiryDateCannotBeMoreThan1YearInTheFuture()
              );
              return;
            }
            await db.notes.setExpiryDate(date.valueOf(), noteId);
            store.refresh();
            showToast("success", strings.expiryDateSet());
            onClose(true);
          }
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => onClose(false)
        }}
      >
        <Flex sx={{ mt: "spacing6", mb: "spacing7", flexDirection: "column" }}>
          <DateField
            id="date"
            label={strings.date()}
            date={date}
            onChange={setDate}
            placeholder={`${db.settings.getDateFormat()}`}
            minDate={dayjs().add(1, "day").toDate()}
            maxDate={dayjs().add(1, "year").toDate()}
          />
        </Flex>
      </Dialog>
    );
  }
);
