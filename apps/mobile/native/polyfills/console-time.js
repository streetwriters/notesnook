const PerformanceNow =
  (global.performance && global.performance.now) ||
  global.performanceNow ||
  global.nativePerformanceNow || (() => { try {
    var now = __DEV__ ? require('fbjs/lib/performanceNow') : () => Date.now()
  } finally { return now }})();

const DEFAULT_LABEL = 'default';
const DEFAULT_PREC  = 3;

let counts     = {};
let startTimes = {};

const fixed = n => Math.trunc(n) === n ? n + '' : n.toFixed(DEFAULT_PREC);

console.time    = console.time    || ((label = DEFAULT_LABEL) => { startTimes[label] = PerformanceNow() });
console.timeLog = console.timeLog || ((label = DEFAULT_LABEL, desc) => timeRecord(label, desc));
console.timeEnd = console.timeEnd || ((label = DEFAULT_LABEL) => timeRecord(label, undefined, true));

console.count = console.count || ((label = DEFAULT_LABEL) => {
  if (!counts[label]) {
    counts[label] = 0;
  }
  counts[label]++;
  console.log(`${label}: ${counts[label]}`);
});

console.countReset = console.countReset || ((label = DEFAULT_LABEL) => {
  if (counts[label]) {
    counts[label] = 0;
  } else {
    console.warn(`Count for '${label}' does not exist`);
  }
});

function timeRecord(label, desc, final) {
  const endTime = PerformanceNow();
  const startTime = startTimes[label];
  if (startTime) {
    const delta = endTime - startTime;
    if (desc) {
      console.log(`${label}: ${fixed(delta)}ms ${desc}`);
    } else {
      console.log(`${label}: ${fixed(delta)}ms`);
    }
    if (final) delete startTimes[label];
  } else {
    console.warn(`Timer '${label}' does not exist`);
  }
}