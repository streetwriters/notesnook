import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';
import {timeSince} from "../../utils/TimeUtils";

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

  return <Text>{timeAgo}</Text>;
};
