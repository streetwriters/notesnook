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

import { getFormattedDate } from "@notesnook/common";
import { getTimeFormat } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { PopupPresenter } from "@notesnook/ui";
import { Flex } from "@theme-ui/components";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useRef, useState } from "react";
import { db } from "../common/db";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { DayPicker } from "../components/day-picker";
import Dialog from "../components/dialog";
import Field from "../components/field";
import { Calendar } from "../components/icons";
import { store as noteStore } from "../stores/note-store";
import { useStore as useThemeStore } from "../stores/theme-store";
import { setDateOnly, setTimeOnly } from "../utils/date-time";
import { showToast } from "../utils/toast";

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
    const [showCalendar, setShowCalendar] = useState(false);
    const [date, setDate] = useState<dayjs.Dayjs>(dayjs(dateCreated));
    const dateInputRef = useRef<HTMLInputElement>(null);
    const theme = useThemeStore((store) => store.colorScheme);

    return (
      <Dialog
        isOpen
        testId="edit-note-creation-date-dialog"
        onClose={() => {
          setShowCalendar(false);
          onClose(false);
        }}
        title={strings.editCreationDate()}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => {
            setShowCalendar(false);
            onClose(false);
          }
        }}
        positiveButton={{
          text: strings.save(),
          onClick: async () => {
            try {
              if (date.isAfter(dayjs())) {
                showToast("error", "Creation date cannot be in the future");
                return;
              }
              if (dateEdited && date.isAfter(dayjs(dateEdited))) {
                showToast(
                  "error",
                  "Creation date cannot be after last edited date"
                );
                return;
              }

              await noteStore.get().updateDateCreated(noteId, date.valueOf());
              setShowCalendar(false);
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
        <Flex sx={{ gap: 2, flexDirection: "column" }}>
          <Field
            id="date-created"
            label={strings.date()}
            required
            inputRef={dateInputRef}
            data-test-id="date-created-input"
            helpText={`${db.settings.getDateFormat()}`}
            action={{
              icon: Calendar,
              onClick() {
                setShowCalendar(!showCalendar);
              }
            }}
            validate={(t) =>
              dayjs(t, db.settings.getDateFormat(), true).isValid()
            }
            defaultValue={date.format(db.settings.getDateFormat())}
            onChange={(e) => setDate((d) => setDateOnly(e.target.value, d))}
          />
          <PopupPresenter
            isOpen={showCalendar}
            onClose={() => setShowCalendar(false)}
            position={{
              isTargetAbsolute: true,
              target: dateInputRef.current,
              location: "below"
            }}
          >
            <DayPicker
              sx={{
                bg: "background",
                p: 2,
                boxShadow: `0px 0px 25px 5px ${
                  theme === "dark" ? "#000000aa" : "#0000004e"
                }`,
                borderRadius: "dialog",
                width: 300
              }}
              selected={dayjs(date).toDate()}
              maxDate={new Date()}
              onSelect={(day) => {
                if (!day) return;
                const date = getFormattedDate(day, "date");
                setDate((d) => setDateOnly(date, d));
                if (dateInputRef.current) dateInputRef.current.value = date;
                setShowCalendar(false);
              }}
            />
          </PopupPresenter>
          <Field
            id="time-created"
            label={strings.time()}
            required
            data-test-id="time-created-input"
            helpText={`${
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
            onChange={(e) => setDate((d) => setTimeOnly(e.target.value, d))}
          />
        </Flex>
      </Dialog>
    );
  }
);
