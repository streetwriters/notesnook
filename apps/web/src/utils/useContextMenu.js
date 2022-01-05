import { useCallback, useEffect, useState } from "react";

var currentEvent = undefined;
function closeMenu() {
  window.dispatchEvent(
    new CustomEvent("globalcontextmenu", { detail: { state: "close" } })
  );
  window.removeEventListener("click", onWindowClick);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("blur", onWindowClick);
}

function getGlobalMenu() {
  return document.getElementById("globalContextMenu");
}

function onKeyDown(event) {
  if (event.keyCode === 27) closeMenu();
}

function onWindowClick(event) {
  if (
    event === currentEvent.nativeEvent ||
    event.target === currentEvent.target
  )
    return;

  closeMenu();
}

// updated positionMenu function
function openMenu(e) {
  e.preventDefault();
  const menu = getGlobalMenu();
  if (menu.style.display === "block") {
    closeMenu();
    return;
  }
  currentEvent = e;

  menu.style.display = "block";

  const clickCoords = getPosition(e);
  const clickCoordsX = clickCoords.x;
  const clickCoordsY = clickCoords.y;

  const menuWidth = menu.offsetWidth + 4;
  const menuHeight = menu.offsetHeight + 4;

  const windowWidth = window.document.body.offsetWidth;
  const windowHeight = window.document.body.offsetHeight;

  if (windowWidth - clickCoordsX < menuWidth) {
    menu.style.left = windowWidth - menuWidth + "px";
  } else {
    menu.style.left = clickCoordsX + "px";
  }

  if (windowHeight - clickCoordsY < menuHeight) {
    menu.style.top = windowHeight - menuHeight + "px";
  } else {
    menu.style.top = clickCoordsY + "px";
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("click", onWindowClick);
  window.addEventListener("blur", onWindowClick);
}

function getPosition(e) {
  var posx = 0;
  var posy = 0;

  if (!e) e = window.event;

  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  } else if (e.clientX || e.clientY) {
    posx =
      e.clientX +
      document.body.scrollLeft +
      document.documentElement.scrollLeft;
    posy =
      e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }

  return {
    x: posx,
    y: posy,
  };
}

function useContextMenu() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState();
  const [state, setState] = useState();
  const [data, setData] = useState();
  useEffect(() => {
    const onGlobalContextMenu = (e) => {
      const { items, title, internalEvent, data, state } = e.detail;
      setState(state);
      if (state === "close") {
        return;
      }
      setItems(items);
      setTitle(title);
      setData(data);
      openMenu(internalEvent);
    };
    window.addEventListener("globalcontextmenu", onGlobalContextMenu);
    return () => {
      window.removeEventListener("globalcontextmenu", onGlobalContextMenu);
    };
  }, []);
  return [items, title, data, state, closeMenu];
}

export function useOpenContextMenu() {
  return useCallback((event, items, data) => {
    window.dispatchEvent(
      new CustomEvent("globalcontextmenu", {
        detail: {
          state: "open",
          items,
          data,
          internalEvent: event,
        },
      })
    );
  }, []);
}

export default useContextMenu;
