// SetManipulator MIT Licence © 2016 Edwin Monk-Fromont http://github.com/edmofro
// Based on setOps.js MIT License © 2014 James Abney http://github.com/jabney

// Set operations union, intersection, symmetric difference,
// relative complement, equals. Set operations are fast.
class SetManipulator {
  constructor(identityExtractor) {
    // Create and push the uid identity method.
    identityExtractor = identityExtractor || (identity => identity);
    this.uidList = [identityExtractor];
    this.uid = identityExtractor;
  }

  // Push a new uid method onto the stack. Call this and
  // supply a unique key generator for sets of objects.
  pushIdentityExtractor(method) {
    this.uidList.push(method);
    this.uid = method;
    return method;
  }

  // Pop the previously pushed uid method off the stack and
  // assign top of stack to uid. Return the previous method.
  popIdentityExtractor() {
    let prev;
    if (this.uidList.length > 1) prev = this.uidList.pop();
    this.uid = this.uidList[this.uidList.length - 1];
    return prev || null;
  }

  // Processes a histogram consructed from two arrays, 'a' and 'b'.
  // This function is used generically by the below set operation
  // methods, a.k.a, 'evaluators', to return some subset of
  // a set union, based on frequencies in the histogram.
  process(a, b, evaluator, identityExtractor) {
    // If identity extractor passed in, push it on the stack
    if (identityExtractor) this.pushIdentityExtractor(identityExtractor);
    // Create a histogram of 'a'.
    const hist = {};
    const out = [];
    let ukey;
    a.forEach(value => {
      ukey = this.uid(value);
      if (!hist[ukey]) {
        hist[ukey] = { value: value, freq: 1 };
      }
    });
    // Merge 'b' into the histogram.
    b.forEach(value => {
      ukey = this.uid(value);
      if (hist[ukey]) {
        if (hist[ukey].freq === 1) hist[ukey].freq = 3;
      } else hist[ukey] = { value: value, freq: 2 };
    });
    // Pop any new identity extractor
    if (identityExtractor) this.popIdentityExtractor(identityExtractor);
    // Call the given evaluator.
    if (evaluator) {
      for (const key in hist) {
        if (!hist.hasOwnProperty(key)) continue; // Property from object prototype, skip
        if (evaluator(hist[key].freq)) out.push(hist[key].value);
      }
      return out;
    }
    return hist;
  }

  // Join two sets together.
  // Set.union([1, 2, 2], [2, 3]) => [1, 2, 3]
  union(a, b, identityExtractor) {
    return this.process(a, b, () => true, identityExtractor);
  }

  // Return items common to both sets.
  // Set.intersection([1, 1, 2], [2, 2, 3]) => [2]
  intersection(a, b, identityExtractor) {
    return this.process(a, b, freq => freq === 3, identityExtractor);
  }

  // Symmetric difference. Items from either set that
  // are not in both sets.
  // Set.difference([1, 1, 2], [2, 3, 3]) => [1, 3]
  difference(a, b, identityExtractor) {
    return this.process(a, b, freq => freq < 3, identityExtractor);
  }

  // Relative complement. Items from 'a' which are
  // not also in 'b'.
  // Set.complement([1, 2, 2], [2, 2, 3]) => [3]
  complement(a, b, identityExtractor) {
    return this.process(a, b, freq => freq === 1, identityExtractor);
  }

  // Returns true if both sets are equivalent, false otherwise.
  // Set.equals([1, 1, 2], [1, 2, 2]) => true
  // Set.equals([1, 1, 2], [1, 2, 3]) => false
  equals(a, b, identityExtractor) {
    let max = 0;
    let min = Math.pow(2, 53);
    const hist = this.process(a, b, identityExtractor);
    for (const key in hist) {
      if (!hist.hasOwnProperty(key)) continue; // Property from object prototype, skip
      max = Math.max(max, hist[key].freq);
      min = Math.min(min, hist[key].freq);
    }
    return min === 3 && max === 3;
  }
}

const setManipulator = new SetManipulator();
export default setManipulator;
