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
import { Flex, Text, type SxProp } from "@ui";
import { CaretLeft, CaretRight } from "../icons";
import { strings } from "@notesnook/intl";

type DayPickerProps = {
  selected: Date;
  minDate?: Date;
  maxDate?: Date;
  onSelect: (date: Date) => void;
  sx?: SxProp;
};

export function DayPicker(props: DayPickerProps) {
  const { selected, minDate, maxDate, onSelect, sx } = props;
  const [current, setCurrent] = useState(dayjs(selected).startOf("month"));
  const [picked, setPicked] = useState(dayjs(selected));
  const min = minDate ? dayjs(minDate).startOf("day") : undefined;
  const max = maxDate ? dayjs(maxDate).endOf("day") : undefined;
  const offset = current.day();
  const cells: (dayjs.Dayjs | null)[] = [
    ...new Array(offset).fill(null),
    ...new Array(current.daysInMonth())
      .fill(0)
      .map((_, index) => current.date(index + 1))
  ];
  const rows: (dayjs.Dayjs | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  const canGoBack = !min || current.isAfter(min, "month");
  const canGoNext = !max || current.isBefore(max, "month");

  return (
    <Flex sx={{ flexDirection: "column", gap: 1, ...sx }}>
      <Flex
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Flex
          onPress={() => canGoBack && setCurrent((c) => c.subtract(1, "month"))}
          sx={{ p: 1, opacity: canGoBack ? 1 : 0.3, borderRadius: "radius1" }}
        >
          <CaretLeft size={15} />
        </Flex>
        <Text variant="body" sx={{ fontWeight: "bold", color: "heading" }}>
          {current.format("MMMM YYYY")}
        </Text>
        <Flex
          onPress={() => canGoNext && setCurrent((c) => c.add(1, "month"))}
          sx={{ p: 1, opacity: canGoNext ? 1 : 0.3, borderRadius: "radius1" }}
        >
          <CaretRight size={15} />
        </Flex>
      </Flex>
      <Flex sx={{ flexDirection: "row" }}>
        {([0, 1, 2, 3, 4, 5, 6] as const).map((day) => (
          <Flex key={day} sx={{ flex: 1, alignItems: "center" }}>
            <Text variant="subBody">{strings.weekDayNamesShort[day]()}</Text>
          </Flex>
        ))}
      </Flex>
      {rows.map((row, rowIndex) => (
        <Flex key={rowIndex} sx={{ flexDirection: "row" }}>
          {[0, 1, 2, 3, 4, 5, 6].map((column) => {
            const day = row[column];
            if (!day) return <Flex key={column} sx={{ flex: 1 }} />;
            const disabled =
              (min && day.isBefore(min, "day")) ||
              (max && day.isAfter(max, "day"));
            const isSelected = day.isSame(picked, "day");
            return (
              <Flex
                key={column}
                testID={`day-${day.format("YYYY-MM-DD")}`}
                onPress={() => {
                  if (disabled) return;
                  setPicked(day);
                  onSelect(day.toDate());
                }}
                sx={{
                  flex: 1,
                  height: 30,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "radius1",
                  opacity: disabled ? 0.3 : 1,
                  bg: isSelected ? "background-selected" : "transparent",
                  ":hover": { bg: disabled ? "transparent" : "hover" }
                }}
              >
                <Text
                  variant="body"
                  sx={{
                    color: isSelected ? "paragraph-selected" : "paragraph"
                  }}
                >
                  {day.date()}
                </Text>
              </Flex>
            );
          })}
        </Flex>
      ))}
    </Flex>
  );
}
