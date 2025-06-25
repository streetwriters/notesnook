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
import { useDatePicker } from "@rehookify/datepicker";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "../icons";
import { SxProp } from "@theme-ui/core";

type DayPickerProps = {
  selected: Date;
  minDate?: Date;
  maxDate?: Date;
  onSelect: (date: Date) => void;
} & SxProp;
export function DayPicker(props: DayPickerProps) {
  const { selected, sx, maxDate, minDate, onSelect } = props;
  const [selectedDates, onDatesChange] = useState<Date[]>([selected]);
  const {
    data: { weekDays, months, years, calendars },
    propGetters: { dayButton, addOffset, subtractOffset, setOffset }
  } = useDatePicker({
    selectedDates,
    onDatesChange: (dates) => {
      onDatesChange(dates);
      onSelect?.(dates[0]);
    },
    dates: {
      maxDate,
      minDate
    },
    years: { numberOfYears: 99 },
    calendar: {
      startDay: 0
    }
  });

  const { month, year, days } = calendars[0];

  return (
    <Flex
      sx={{
        flexDirection: "column",
        ...sx
      }}
    >
      <Flex
        sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}
      >
        <Flex sx={{ alignItems: "center", justifyContent: "start", gap: 1 }}>
          <Button
            variant="icon"
            sx={{ p: 0 }}
            {...subtractOffset({ months: 1 })}
          >
            <ChevronLeft />
          </Button>
          <select
            style={{
              backgroundColor: "var(--background-secondary)",
              outline: "none",
              border: "1px solid var(--border-secondary)",
              borderRadius: "5px",
              color: "var(--paragraph)",
              padding: "5px",
              overflow: "hidden"
            }}
            value={month}
            onChange={(e) => {
              const selectedOption = e.target.selectedOptions[0];
              setOffset(new Date(selectedOption.dataset.date || ""))?.onClick?.(
                e
              );
            }}
          >
            {months.map((month) => (
              <option
                key={month.month + year}
                value={month.month}
                data-date={month.$date.toDateString()}
              >
                {month.month}
              </option>
            ))}
          </select>
          <select
            style={{
              backgroundColor: "var(--background-secondary)",
              outline: "none",
              border: "1px solid var(--border-secondary)",
              borderRadius: "5px",
              color: "var(--paragraph)",
              padding: "5px",
              overflow: "hidden"
            }}
            value={year}
            onChange={(e) => {
              const selectedOption = e.target.selectedOptions[0];
              setOffset(new Date(selectedOption.dataset.date || ""))?.onClick?.(
                e
              );
            }}
          >
            {years.map((year) => (
              <option
                key={year.year}
                value={year.year}
                data-date={year.$date.toDateString()}
              >
                {year.year}
              </option>
            ))}
          </select>
        </Flex>
        <Button variant="icon" sx={{ p: 0 }} {...addOffset({ months: 1 })}>
          <ChevronRight />
        </Button>
      </Flex>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          mt: 2
        }}
      >
        {weekDays.map((day) => (
          <Text
            variant="body"
            key={day}
            sx={{ fontWeight: "bold", textAlign: "center" }}
          >
            {day}
          </Text>
        ))}
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          mt: 2
        }}
      >
        {days.map((day) => (
          <Button
            key={day.$date.toString()}
            variant="icon"
            sx={{
              p: 0,
              m: 0,
              borderRadius: 100,
              height: 35,
              width: 35,
              bg: day.selected ? "background-selected" : "transparent",
              border: day.selected ? "1px solid var(--border-selected)" : "none"
            }}
            {...dayButton(day)}
          >
            <Text
              variant="body"
              sx={{
                fontWeight: day.now ? "bold" : "normal",
                color: day.now
                  ? "accent"
                  : day.selected
                  ? "accent-selected"
                  : day.inCurrentMonth
                  ? "paragraph"
                  : "paragraph-secondary",
                textAlign: "center"
              }}
            >
              {day.day}
            </Text>
          </Button>
        ))}
      </Box>
    </Flex>
  );
}
