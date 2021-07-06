import openLink from "../commands/openLink";

window.open = function (url, target) {
  openLink(url, target);
};
