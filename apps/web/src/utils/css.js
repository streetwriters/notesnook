export function injectCss(rule) {
  let variableCss = document.getElementById("variables");
  let head = document.getElementsByTagName("head")[0];
  if (variableCss) {
    head.removeChild(variableCss);
  }
  let css = document.createElement("style");
  css.type = "text/css";
  css.id = "variables";
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
