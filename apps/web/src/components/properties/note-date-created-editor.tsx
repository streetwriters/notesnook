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

import { useState, useRef } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { Calendar, Edit } from "../icons";
import Field from "../field";
import { DayPicker } from "../day-picker";
import { PopupPresenter } from "@notesnook/ui";
import { db } from "../../common/db";
import { showToast } from "../../utils/toast";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { store as noteStore } from "../../stores/note-store";
import { getFormattedDate } from "@notesnook/common";
import { getTimeFormat } from "@notesnook/core";
import { setTimeOnly, setDateOnly } from "../../utils/date-time";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { strings } from "@notesnook/intl";

dayjs.extend(customParseFormat);

type NoteDateCreatedEditorProps = {
  noteId: string;
  dateCreated: number;
  dateEdited: number;
  displayValue: string;
};

export function NoteDateCreatedEditor({
  noteId,
  dateCreated,
  dateEdited,
  displayValue
}: NoteDateCreatedEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editedDate, setEditedDate] = useState<dayjs.Dayjs>(dayjs());
  const dateTextRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const theme = useThemeStore((store) => store.colorScheme);

  return (
    <>
      <Flex sx={{ alignItems: "center", gap: 1 }}>
        <Text
          data-test-id="date-created"
          ref={dateTextRef}
          className="selectable"
          variant="subBody"
          sx={{ fontSize: "body", flexShrink: 0 }}
        >
          {displayValue}
        </Text>
        <Edit
          size={14}
          sx={{ cursor: "pointer", color: "icon" }}
          onClick={() => {
            setEditedDate(dayjs(dateCreated));
            setIsEditing(true);
          }}
          data-test-id="edit-date-created"
        />
      </Flex>
      {isEditing && (
        <PopupPresenter
          isOpen={isEditing}
          onClose={() => {
            setIsEditing(false);
            setShowCalendar(false);
          }}
          position={{
            isTargetAbsolute: true,
            target: dateTextRef.current,
            location: "below"
          }}
        >
          <Flex
            sx={{
              bg: "background",
              p: 3,
              boxShadow: `0px 0px 25px 5px ${
                theme === "dark" ? "#000000aa" : "#0000004e"
              }`,
              borderRadius: "dialog",
              flexDirection: "column",
              gap: 2,
              width: 350
            }}
            data-test-id="edit-date-created-popup"
          >
            <Text variant="subtitle">{strings.editCreationDate()}</Text>
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
                defaultValue={editedDate.format(db.settings.getDateFormat())}
                onChange={(e) =>
                  setEditedDate((d) => setDateOnly(e.target.value, d))
                }
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
                  selected={dayjs(editedDate).toDate()}
                  maxDate={new Date()}
                  onSelect={(day) => {
                    if (!day) return;
                    const date = getFormattedDate(day, "date");
                    setEditedDate((d) => setDateOnly(date, d));
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
                    db.settings.getTimeFormat() === "12-hour"
                      ? "hh:mm a"
                      : "HH:mm";
                  return dayjs(t.toLowerCase(), format, true).isValid();
                }}
                defaultValue={editedDate.format(
                  getTimeFormat(db.settings.getTimeFormat())
                )}
                onChange={(e) =>
                  setEditedDate((d) => setTimeOnly(e.target.value, d))
                }
              />
            </Flex>
            <Flex sx={{ gap: 2, justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setShowCalendar(false);
                }}
              >
                {strings.cancel()}
              </Button>
              <Button
                variant="accentSecondary"
                data-test-id="save-date-created"
                onClick={async () => {
                  try {
                    if (editedDate.isAfter(dayjs())) {
                      showToast(
                        "error",
                        "Creation date cannot be in the future"
                      );
                      return;
                    }
                    if (dateEdited && editedDate.isAfter(dayjs(dateEdited))) {
                      showToast(
                        "error",
                        "Creation date cannot be after last edited date"
                      );
                      return;
                    }

                    await noteStore
                      .get()
                      .updateDateCreated(noteId, editedDate.valueOf());
                    setIsEditing(false);
                    setShowCalendar(false);
                  } catch (error) {
                    showToast(
                      "error",
                      "Failed to update creation date: " +
                        (error as Error).message
                    );
                  }
                }}
              >
                {strings.save()}
              </Button>
            </Flex>
          </Flex>
        </PopupPresenter>
      )}
    </>
  );
}
