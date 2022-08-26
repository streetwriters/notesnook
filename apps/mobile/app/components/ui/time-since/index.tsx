import React, { useEffect, useRef, useState } from "react";
import { TextProps } from "react-native";
import { timeSince } from "../../../utils/time";
import Paragraph from "../typography/paragraph";

interface TimeSinceProps extends TextProps {
  updateFrequency: number;
  time: number;
}

export const TimeSince = ({
  time,
  style,
  updateFrequency = 30000
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

  return <Paragraph style={style}>{timeAgo}</Paragraph>;
};
