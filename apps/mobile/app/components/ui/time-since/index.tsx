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

import React, { useEffect, useRef, useState } from "react";
import { TextProps } from "react-native";
import { timeSince } from "../../../utils/time";
import Heading from "../typography/heading";
import Paragraph from "../typography/paragraph";
interface TimeSinceProps extends TextProps {
  updateFrequency: number;
  time: number;
  bold?: boolean;
}

export const TimeSince = ({
  time,
  style,
  updateFrequency = 30000,
  bold
}: TimeSinceProps) => {
  const [timeAgo, setTimeAgo] = useState<string | null>(null);
  const interval = useRef<NodeJS.Timer>();

  useEffect(() => {
    let t = timeSince(time || Date.now());
    setTimeAgo(t);
    interval.current = setInterval(() => {
      t = timeSince(time);
      setTimeAgo(t);
    }, updateFrequency);
    return () => {
      interval.current && clearInterval(interval.current);
    };
  }, [time, updateFrequency]);

  return bold ? (
    <Heading style={style}>{timeAgo}</Heading>
  ) : (
    <Paragraph style={style}>{timeAgo}</Paragraph>
  );
};
