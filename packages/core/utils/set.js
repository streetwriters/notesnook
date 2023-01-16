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

// SetManipulator MIT Licence © 2016 Edwin Monk-Fromont http://github.com/edmofro
// Based on setOps.js MIT License © 2014 James Abney http://github.com/jabney

// Set operations union, intersection, symmetric difference,
// relative complement, equals. Set operations are fast.
export class SetManipulator {
  constructor() {}

  // Processes a histogram consructed from two arrays, 'a' and 'b'.
  // This function is used generically by the below set operation
  // methods, a.k.a, 'evaluators', to return some subset of
  // a set union, based on frequencies in the histogram.
  process(a, b, getKey = (k) => k, evaluator) {
    // If identity extractor passed in, push it on the stack
    //if (identityExtractor) this.pushIdentityExtractor(identityExtractor);
    // Create a histogram of 'a'.
    const hist = {};
    const out = [];
    let ukey;
    a.forEach((value) => {
      ukey = getKey(value);
      if (!hist[ukey]) {
        hist[ukey] = { value: value, freq: 1 };
      }
    });
    // Merge 'b' into the histogram.
    b.forEach((value) => {
      ukey = getKey(value);
      if (hist[ukey]) {
        if (hist[ukey].freq === 1) hist[ukey].freq = 3;
      } else hist[ukey] = { value: value, freq: 2 };
    });
    // Pop any new identity extractor
    //if (identityExtractor) this.popIdentityExtractor(identityExtractor);
    // Call the given evaluator.
    if (evaluator) {
      for (const key in hist) {
        //if (!hist.hasOwnProperty(key)) continue; // Property from object prototype, skip
        if (evaluator(hist[key].freq)) out.push(hist[key].value);
      }
      return out;
    }
    return hist;
  }

  // Join two sets together.
  // Set.union([1, 2, 2], [2, 3]) => [1, 2, 3]
  union(a, b, getKey) {
    return this.process(a, b, getKey, () => true);
  }

  // Return items common to both sets.
  // Set.intersection([1, 1, 2], [2, 2, 3]) => [2]
  intersection(a, b) {
    return this.process(a, b, undefined, (freq) => freq === 3);
  }

  // Symmetric difference. Items from either set that
  // are not in both sets.
  // Set.difference([1, 1, 2], [2, 3, 3]) => [1, 3]
  difference(a, b) {
    return this.process(a, b, undefined, (freq) => freq < 3);
  }

  // Relative complement. Items from 'a' which are
  // not also in 'b'.
  // Set.complement([1, 2, 2], [2, 2, 3]) => [3]
  complement(a, b) {
    return this.process(a, b, undefined, (freq) => freq === 1);
  }

  // Returns true if both sets are equivalent, false otherwise.
  // Set.equals([1, 1, 2], [1, 2, 2]) => true
  // Set.equals([1, 1, 2], [1, 2, 3]) => false
  equals(a, b) {
    let max = 0;
    let min = Math.pow(2, 53);
    const hist = this.process(a, b);
    for (const key in hist) {
      // if (!hist.hasOwnProperty(key)) continue; // Property from object prototype, skip
      max = Math.max(max, hist[key].freq);
      min = Math.min(min, hist[key].freq);
    }
    return min === 3 && max === 3;
  }
}

const setManipulator = new SetManipulator();
export default setManipulator;
