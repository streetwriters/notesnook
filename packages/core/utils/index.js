export function extractValues(obj) {
  const t = [];
  for (let key in obj) {
    t[t.length] = obj[key];
  }
  return t;
}

export function groupBy(xs, key) {
  return tfun.reduce(function(rv, x) {
    var v = key instanceof Function ? key(x) : x[key];
    (rv[v] = rv[v] || []).push(x);
    return rv;
  })(xs);
}
