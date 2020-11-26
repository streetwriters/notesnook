import React, {useEffect, useState} from 'react';
import {timeSince} from "../../utils/TimeUtils";
import Paragraph from '../Typography/Paragraph';

export const TimeSince = ({time}) => {
  const [timeAgo, setTimeAgo] = useState(null);

  useEffect(() => {
    let t = timeSince(time);
      setTimeAgo(t);
    let interval = setInterval(() => {
      t = timeSince(time);
      setTimeAgo(t);
    }, 60000);
    return () => {
      clearInterval(interval);
      interval = null;
    };
  },[]);

  return <Paragraph>{timeAgo}</Paragraph>;
};
