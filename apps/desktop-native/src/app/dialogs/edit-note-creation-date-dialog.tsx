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
import { getTimeFormat } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { Clock } from "../components/icons";
import { store as noteStore } from "../stores/note-store";
import { setTimeOnly } from "../utils/date-time";
import { showToast } from "../utils/toast";
import { DateField } from "./components/date-field";
import { Field } from "./components/field";

dayjs.extend(customParseFormat);

type EditNoteCreationDateDialogProps = BaseDialogProps<boolean> & {
  noteId: string;
  dateCreated: number;
  dateEdited: number;
};

export const EditNoteCreationDateDialog = DialogManager.register(
  function EditNoteCreationDateDialog({
    noteId,
    dateCreated,
    dateEdited,
    onClose
  }: EditNoteCreationDateDialogProps) {
    const [date, setDate] = useState<dayjs.Dayjs>(dayjs(dateCreated));

    return (
      <Dialog
        isOpen
        testID="edit-note-creation-date-dialog"
        onClose={() => onClose(false)}
        title={strings.editCreationDate()}
        description={`${strings.creationDateCannotBeAfterLastEditedDate()}`}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => onClose(false)
        }}
        positiveButton={{
          text: strings.save(),
          onClick: async () => {
            try {
              if (dateEdited && date.isAfter(dayjs(dateEdited), "minute")) {
                showToast(
                  "error",
                  strings.creationDateCannotBeAfterLastEditedDate()
                );
                return;
              }
              await noteStore.get().updateDateCreated(noteId, date.valueOf());
              onClose(false);
            } catch (error) {
              showToast(
                "error",
                "Failed to update creation date: " + (error as Error).message
              );
            }
          }
        }}
      >
        <Flex
          sx={{
            gap: 2,
            flexDirection: "column",
            mt: "spacing6",
            mb: "spacing7"
          }}
        >
          <DateField
            id="date-created"
            testID="date-created-input"
            label={strings.date()}
            date={date}
            onChange={setDate}
            maxDate={new Date(dateEdited)}
          />
          <Field
            id="time-created"
            label={strings.time()}
            required
            testID="time-created-input"
            placeholder={`${
              db.settings.getTimeFormat() === "12-hour"
                ? "hh:mm AM/PM"
                : "hh:mm"
            }`}
            validate={(t) => {
              const format =
                db.settings.getTimeFormat() === "12-hour" ? "hh:mm a" : "HH:mm";
              return dayjs(t.toLowerCase(), format, true).isValid();
            }}
            defaultValue={date.format(
              getTimeFormat(db.settings.getTimeFormat())
            )}
            onChangeText={(text) => setDate((d) => setTimeOnly(text, d))}
            rightActions={[{ icon: Clock }]}
          />
        </Flex>
      </Dialog>
    );
  }
);
