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
import { Flex } from "@ui";
import { getFormattedDate } from "@notesnook/common";
import { db } from "../../common/db";
import { CalendarDots } from "../../components/icons";
import { setDateOnly } from "../../utils/date-time";
import { DayPicker } from "./day-picker";
import { Field } from "./field";
import { InlinePopup } from "./inline-popup";

dayjs.extend(customParseFormat);

export function DateField(props: {
  id: string;
  testID?: string;
  label: string;
  date: dayjs.Dayjs;
  onChange: (update: (date: dayjs.Dayjs) => dayjs.Dayjs) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <Flex sx={{ position: "relative", flexDirection: "column" }}>
      <Field
        key={key}
        id={props.id}
        testID={props.testID}
        label={props.label}
        required
        placeholder={props.placeholder}
        action={{
          icon: CalendarDots,
          onPress: () => setShowCalendar((s) => !s)
        }}
        validate={(t) => dayjs(t, db.settings.getDateFormat(), true).isValid()}
        defaultValue={props.date.format(db.settings.getDateFormat())}
        onChangeText={(text) => props.onChange((d) => setDateOnly(text, d))}
      />
      <InlinePopup isOpen={showCalendar} sx={{ top: 60 }}>
        <DayPicker
          sx={{ p: 2, width: 300 }}
          selected={props.date.toDate()}
          minDate={props.minDate}
          maxDate={props.maxDate}
          onSelect={(day) => {
            const formatted = getFormattedDate(day, "date");
            props.onChange((d) => setDateOnly(formatted, d));
            setKey((k) => k + 1);
            setShowCalendar(false);
          }}
        />
      </InlinePopup>
    </Flex>
  );
}
