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

import { useState, useEffect } from "react";

type TextScrambleProps = {
  text: string;
  className?: string;
  letterSpeed?: number;
  nextLetterSpeed?: number;
  paused?: boolean;
  pauseTime?: number;
};

const randomItem = (array: Array<any>) =>
  array[Math.floor(Math.random() * array.length)];

const nextItem = (array: Array<any>, currentItem: any) => {
  const currentIndex = array.indexOf(currentItem);
  const bound = array.length;
  const nextIndex = (currentIndex + bound + 1) % bound;
  return array[nextIndex];
};

const symbols: string[] = "-=_+/.,<>;'!@#$%^&*()".split("");

export function TextScramble(props: TextScrambleProps) {
  const {
    text,
    className,
    letterSpeed = 5,
    nextLetterSpeed = 100,
    paused = false,
    pauseTime = 1500
  } = props;

  const initSymbols: string[] = Array(text.length)
    .fill(0)
    .map(() => randomItem(symbols));

  const [displayedText, setDisplayedText] = useState<string[]>(initSymbols);

  const leftIndexes: number[] = [];

  const defaultLeftIndexes = (): void => {
    text.split("").forEach((_, i) => {
      leftIndexes.push(i);
    });
  };

  let bakeLetterInterval: any = 0;
  let bakeTextInterval: any = 0;

  const bakeLetter = () => {
    bakeLetterInterval = setInterval(() => {
      if (!paused) {
        const updatedText: string[] = [];

        text.split("").forEach((_, i) => {
          if (!leftIndexes.includes(i)) {
            updatedText[i] = text[i];
            return;
          }

          const randomSymbol = randomItem(symbols);
          updatedText[i] = randomSymbol;
        });

        setDisplayedText(updatedText);
      }
    }, letterSpeed);
  };

  const bakeText = () => {
    defaultLeftIndexes();
    bakeLetter();

    bakeTextInterval = setInterval(() => {
      if (!paused) {
        if (leftIndexes.length === 0) {
          clearInterval(bakeLetterInterval);
          clearInterval(bakeTextInterval);

          setTimeout(() => {
            // setCurrentText(text);
            defaultLeftIndexes();
          }, pauseTime);
        }

        leftIndexes.shift();
      }
    }, nextLetterSpeed);
  };

  useEffect(() => {
    if (!paused) bakeText();
  }, [text, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className={className}>{displayedText}</div>;
}
