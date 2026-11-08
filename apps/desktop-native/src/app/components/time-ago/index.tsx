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

import { memo } from "react";
import { useTimeAgo } from "@notesnook/common";
import { Text, type TextProps } from "@ui";

type TDate = Parameters<typeof useTimeAgo>[0];

type TimeAgoProps = {
  datetime: TDate;
  locale?: "short" | "en_short";
  live?: boolean;
  interval?: number;
} & Omit<TextProps, "children">;

function TimeAgo({
  datetime,
  live,
  locale,
  interval,
  sx,
  ...restProps
}: TimeAgoProps) {
  const time = useTimeAgo(datetime, { live, locale, interval });

  return (
    <Text {...restProps} testID="time" sx={{ fontFamily: "body", ...sx }}>
      {time}
    </Text>
  );
}

export default memo(TimeAgo);
