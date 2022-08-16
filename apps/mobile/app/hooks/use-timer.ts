import { useEffect, useRef, useState } from 'react';

const timers: { [name: string]: number } = {};

function getSecondsLeft(id?: string) {
  let endTime = timers[id || ''];
  if (!endTime) return 0;
  if (endTime < Date.now()) return 0;
  console.log((endTime - Date.now()) / 1000);
  return ((endTime - Date.now()) / 1000).toFixed(0);
}

const useTimer = (initialId?: string) => {
  const [id, setId] = useState(initialId);
  const [seconds, setSeconds] = useState(getSecondsLeft(id));
  const interval = useRef<NodeJS.Timer>();

  const start = (sec: number, currentId = id) => {
    console.log('started', sec, id);
    if (!currentId) return;
    timers[currentId] = Date.now() + sec * 1000;
    console.log('timers:', timers[currentId]);
    setSeconds(getSecondsLeft(id));
  };

  useEffect(() => {
    console.log(seconds);
    interval.current = setInterval(() => {
      let timeLeft = getSecondsLeft(id);
      setSeconds(timeLeft);
      if (timeLeft === 0) interval.current && clearInterval(interval.current);
    }, 1000);

    return () => {
      interval.current && clearInterval(interval.current);
    };
  }, [seconds, id]);

  return { seconds, setId, start };
};

export default useTimer;
