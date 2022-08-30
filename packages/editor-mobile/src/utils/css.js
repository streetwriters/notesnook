export function removeCss(id) {
  var link = document.getElementById(id);
  link.remove();
}

export function injectCssSrc(id, src) {
  var head = document.head;
  var link = document.createElement("link");

  link.id = id;
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = src;

  head.appendChild(link);
}

export function injectCss(rule) {
  let variableCss = document.getElementById("variables-nn");
  let head = document.getElementsByTagName("head")[0];
  if (variableCss) {
    head.removeChild(variableCss);
  }
  let css = document.createElement("style");
  css.type = "text/css";
  css.id = "variables-nn";
  // Support for IE
  if (css.styleSheet) css.styleSheet.cssText = rule;
  // Support for the rest
  else css.appendChild(document.createTextNode(rule));
  head.insertBefore(css, getRootStylesheet());
}

function getRootStylesheet() {
  for (let sty of document.getElementsByTagName("style")) {
    if (sty.innerHTML.includes("#root")) {
      return sty;
    }
  }
}

export function changeSvgTheme(newAccent) {
  var nodes = document.querySelectorAll('*[fill="#0560ff"]');
  for (var n = 0; n < nodes.length; ++n)
    nodes[n].setAttribute("fill", newAccent);
}

export function transform(colors) {
  let root = ":root {";
  for (let color in colors) {
    root += `--nn_${color}: ${colors[color]};`;
  }
  return root + "}";
}
