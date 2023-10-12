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

// Set operations union, intersection, symmetric difference,
// relative complement, equals. Set operations are fast.
type KeySelector<T> = (item: T) => string;
type Histogram<T> = Record<string, { value: T; frequency: number }>;
type HistogramEvaluator = (frequency: number) => boolean;

class SetManipulator {
  constructor() {}

  // Processes a histogram consructed from two arrays, 'a' and 'b'.
  // This function is used generically by the below set operation
  // methods, a.k.a, 'evaluators', to return some subset of
  // a set union, based on frequencies in the histogram.
  process<T>(
    a: T[],
    b: T[],
    key: KeySelector<T> = (item) => String(item),
    evaluator?: HistogramEvaluator
  ): Histogram<T> | T[] {
    // If identity extractor passed in, push it on the stack
    //if (identityExtractor) this.pushIdentityExtractor(identityExtractor);
    // Create a histogram of 'a'.
    const hist: Histogram<T> = {};
    const out = [];
    let ukey;
    a.forEach((value) => {
      ukey = key(value);
      if (!hist[ukey]) {
        hist[ukey] = { value, frequency: 1 };
      }
    });

    // Merge 'b' into the histogram.
    b.forEach((value) => {
      ukey = key(value);
      if (hist[ukey]) {
        if (hist[ukey].frequency === 1) hist[ukey].frequency = 3;
      } else hist[ukey] = { value: value, frequency: 2 };
    });

    // Pop any new identity extractor
    //if (identityExtractor) this.popIdentityExtractor(identityExtractor);
    // Call the given evaluator.
    if (evaluator) {
      for (const key in hist) {
        //if (!hist.hasOwnProperty(key)) continue; // Property from object prototype, skip
        if (evaluator(hist[key].frequency)) out.push(hist[key].value);
      }
      return out;
    }
    return hist;
  }

  // Join two sets together.
  // Set.union([1, 2, 2], [2, 3]) => [1, 2, 3]
  union<T>(a: T[], b: T[], key?: KeySelector<T>) {
    return <T[]>this.process(a, b, key, () => true);
  }

  // Return items common to both sets.
  // Set.intersection([1, 1, 2], [2, 2, 3]) => [2]
  intersection<T>(a: T[], b: T[], key: KeySelector<T>) {
    return this.process(a, b, key, (freq) => freq === 3);
  }

  // Symmetric difference. Items from either set that
  // are not in both sets.
  // Set.difference([1, 1, 2], [2, 3, 3]) => [1, 3]
  difference<T>(a: T[], b: T[], key?: KeySelector<T>) {
    return <T[]>this.process(a, b, key, (freq) => freq < 3);
  }

  // Relative complement. Items from 'a' which are
  // not also in 'b'.
  // Set.complement([1, 2, 2], [2, 2, 3]) => [3]
  complement<T>(a: T[], b: T[], key?: KeySelector<T>) {
    return this.process(a, b, key, (freq) => freq === 1);
  }

  // Returns true if both sets are equivalent, false otherwise.
  // Set.equals([1, 1, 2], [1, 2, 2]) => true
  // Set.equals([1, 1, 2], [1, 2, 3]) => false
  equals<T>(a: T[], b: T[], key: KeySelector<T>) {
    let max = 0;
    let min = Math.pow(2, 53);
    const hist = <Histogram<T>>this.process(a, b, key);

    for (const key in hist) {
      // if (!hist.hasOwnProperty(key)) continue; // Property from object prototype, skip
      max = Math.max(max, hist[key].frequency);
      min = Math.min(min, hist[key].frequency);
    }
    return min === 3 && max === 3;
  }
}

export const set = new SetManipulator();
