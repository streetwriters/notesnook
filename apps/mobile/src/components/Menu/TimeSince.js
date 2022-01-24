import React, { useEffect, useState } from 'react';
import { timeSince } from '../../utils/TimeUtils';
import Paragraph from '../Typography/Paragraph';

export const TimeSince = ({ time, style, updateFrequency = 30000 }) => {
  const [timeAgo, setTimeAgo] = useState(null);

  useEffect(() => {
    let t = timeSince(time || Date.now());
    setTimeAgo(t);
    let interval = setInterval(() => {
      t = timeSince(time);
      setTimeAgo(t);
    }, updateFrequency);
    return () => {
      clearInterval(interval);
      interval = null;
    };
  }, [time, updateFrequency]);

  return <Paragraph style={style}>{timeAgo}</Paragraph>;
};
