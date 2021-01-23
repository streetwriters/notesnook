import Quill from "quill";

const List = Quill.import("formats/list");

class BetterList extends List {
  constructor(_scroll, el) {
    super(_scroll, el);

    const isCheckList = el.hasAttribute("data-checked");
    el.addEventListener("touchstart", (e) => {
      if (!isCheckList) {
        return;
      }
      e.preventDefault();
    });
  }
}

Quill.register("formats/lists", BetterList);
