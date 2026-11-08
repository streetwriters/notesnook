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

import { Box, Flex, Text, type SxProp } from "@ui";

type MonthlyActivityHeatmapProps = {
  monthlyStats: Record<string, number>;
  year?: number;
  sx?: SxProp;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

export function MonthlyActivityHeatmap({
  monthlyStats
}: MonthlyActivityHeatmapProps) {
  const maxCount = Math.max(...Object.values(monthlyStats), 1);

  const monthData = MONTHS.map((month) => ({
    month,
    count: monthlyStats[month] || 0
  }));

  return (
    <Flex
      sx={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 2,
        height: "100%",
        width: "100%",
        position: "relative",
        pb: 2
      }}
    >
      {monthData.map((data, index) => {
        const barHeight = maxCount > 0 ? (data.count / maxCount) * 100 : 0;

        return (
          <Flex
            key={data.month}
            group="month"
            sx={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              flex: 1,
              gap: 2,
              cursor: "pointer",
              height: "100%"
            }}
          >
            <Flex
              sx={{
                opacity: 0,
                bg: "background",
                zIndex: 1000,
                ":group-hover": { group: "month", style: { opacity: 1 } }
              }}
            >
              <Text variant="body" sx={{ fontWeight: "bold" }}>
                {data.count}
              </Text>
            </Flex>
            <Box
              sx={{
                width: "100%",
                height: `${barHeight}%`,
                minHeight: data.count > 0 ? 10 : 5,
                bg: maxCount === data.count ? "accent" : "paragraph",
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                position: "relative",
                ":group-hover": { group: "month", style: { bg: "accent" } }
              }}
            />
            <Text
              sx={{
                fontSize: 11,
                color: "paragraph-secondary",
                fontWeight: "normal"
              }}
            >
              {MONTHS_SHORT[index]}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}
