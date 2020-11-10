function isMobile() {
  var match = window.matchMedia || window.msMatchMedia;
  if (match) {
    var mq = match("(max-width: 480px)");
    return mq.matches;
  }
  return false;
}

function isTablet() {
  var match = window.matchMedia || window.msMatchMedia;
  if (match) {
    var mq = match("(min-width: 480px) and (max-width: 1000px)");
    return mq.matches;
  }
  return false;
}

export { isMobile, isTablet };
