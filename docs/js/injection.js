function loadTrackerScript() {
  var script = document.createElement("script");
  script.src = "https://analytics.streetwriters.co/umami.js";
  script.async = true;
  script.dataset.websiteId = "ad34576b-2721-436c-b36a-47a614009d2b";
  script.dataset.domains = "docs.notesnook.com";
  script.dataset.autoTrack = "true";
  script.dataset.doNotTrack = "false";
  var firstScriptElement = document.getElementsByTagName("script")[0];
  firstScriptElement.parentNode.insertBefore(script, firstScriptElement);
}

(function main() {
  loadTrackerScript();
})();
