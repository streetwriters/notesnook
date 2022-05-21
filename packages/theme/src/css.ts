export function removeCss(id: string) {
  var link = document.getElementById(id);
  if (link) link.remove();
}

export function injectCssSrc(id: string, src: string) {
  var head = document.head;
  var link = document.createElement("link");

  link.id = id;
  link.type = "text/css";
  link.rel = "stylesheet";
  link.href = src;

  head.appendChild(link);
}

export function injectCss(rules: string) {
  let variableCss = document.getElementById("variables");
  let head = document.getElementsByTagName("head")[0];
  if (variableCss) {
    head.removeChild(variableCss);
  }
  let css = document.createElement("style");
  css.type = "text/css";
  css.id = "variables";
  // Support for IE
  if ("styleSheet" in css) (css as any).styleSheet.cssText = rules;
  // Support for the rest
  else css.appendChild(document.createTextNode(rules));

  head.insertBefore(css, getRootStylesheet());
}

function getRootStylesheet() {
  for (let sty of document.getElementsByTagName("style")) {
    if (sty.innerHTML.includes("#root")) {
      return sty;
    }
  }
  return null;
}

export function changeSvgTheme(newAccent: string) {
  var nodes = document.querySelectorAll('*[fill="#0560ff"]');
  for (var n = 0; n < nodes.length; ++n)
    nodes[n].setAttribute("fill", newAccent);
}
