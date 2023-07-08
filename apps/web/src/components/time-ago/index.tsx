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

import React, { useRef } from "react";
import { Text, TextProps } from "@theme-ui/components";
import { type TDate } from "timeago.js";
import { useTimeAgo } from "@notesnook/common";

type TimeAgoProps = {
  datetime: TDate;
  locale?: "short" | "en_short";
  live?: boolean;
  interval?: number;
};
function TimeAgo({
  datetime,
  live,
  locale,
  interval,
  sx,
  ...restProps
}: TimeAgoProps & TextProps) {
  const timeRef = useRef<HTMLDivElement>(null);

  const time = useTimeAgo(datetime, { live, locale, interval });

  return (
    <Text
      {...restProps}
      ref={timeRef}
      sx={{
        fontFamily: "body",
        ...sx,
        color: (sx && (sx as any)["color"]) || "inherit"
      }}
      as="time"
      data-test-id="time"
    >
      {time}
    </Text>
  );
}

export default React.memo(TimeAgo);
