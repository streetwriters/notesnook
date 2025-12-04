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

import { Box, Flex, Text } from "@theme-ui/components";
import { SxProp } from "@theme-ui/core";

type MonthlyActivityHeatmapProps = {
  monthlyStats: Record<string, number>;
  year?: number;
} & SxProp;

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
  // Find max count for bar height calculation
  const maxCount = Math.max(...Object.values(monthlyStats), 1);

  // Create month data with counts
  const monthData = MONTHS.map((month) => ({
    month,
    count: monthlyStats[month] || 0
  }));

  return (
    <>
      {/* Bar chart */}
      <Flex
        sx={{
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
              sx={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                flex: 1,
                gap: 2,
                cursor: "pointer",
                "&:hover .tooltip": { opacity: 1 },
                "&:hover .bar": { bg: "accent" },
                height: "100%"
              }}
            >
              <Flex
                className="tooltip"
                sx={{ opacity: 0, bg: "background", zIndex: 1000 }}
              >
                <Text variant="body" sx={{ fontWeight: "bold" }}>
                  {data.count}
                </Text>
              </Flex>
              <Box
                className="bar"
                sx={{
                  width: "100%",
                  height: `${barHeight}%`,
                  minHeight: data.count > 0 ? "10px" : "5px",
                  bg: maxCount === data.count ? "accent" : "paragraph",
                  borderRadius: "4px 4px 0 0",
                  transition: "all 0.3s ease",
                  position: "relative",
                  "&:hover": {
                    transform: "scaleY(1.05)",
                    transformOrigin: "bottom"
                  }
                }}
              ></Box>

              <Text
                sx={{
                  fontSize: "11px",
                  color: "paragraph-secondary",
                  fontWeight: "normal",
                  transition: "all 0.3s ease"
                }}
              >
                {MONTHS_SHORT[index]}
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </>
  );
}
