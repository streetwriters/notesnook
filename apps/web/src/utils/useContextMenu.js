import { useEffect, useState } from "react";

var isOpening = false;

function closeMenu() {
  if (isOpening) {
    isOpening = false;
    return;
  }
  const menu = document.getElementById("globalContextMenu");
  menu.style.display = "none";
  window.removeEventListener("click", onWindowClick);
  window.removeEventListener("keydown", onKeyDown);
}

function onKeyDown(event) {
  if (event.keyCode === 27) closeMenu();
}

function onWindowClick() {
  closeMenu();
}

// updated positionMenu function
var lastTarget;
function openMenu(e) {
  e.preventDefault();
  const menu = document.getElementById("globalContextMenu");
  if (e.type === "click") {
    isOpening = true;
    // make it work like a toggle button
    if (menu.style.display === "block" && e.target === lastTarget) {
      closeMenu();
      return;
    }
    lastTarget = e.target;
  }

  const clickCoords = getPosition(e);
  const clickCoordsX = clickCoords.x;
  const clickCoordsY = clickCoords.y;

  const menuWidth = menu.offsetWidth + 4;
  const menuHeight = menu.offsetHeight + 4;

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

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
  menu.style.display = "block";

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("click", onWindowClick);
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
  const [data, setData] = useState({});
  const [title, setTitle] = useState();
  useEffect(() => {
    const onGlobalContextMenu = (e) => {
      const { items, data, title, internalEvent } = e.detail;
      setItems(items);
      setData(data);
      setTitle(title);
      openMenu(internalEvent);
    };
    window.addEventListener("globalcontextmenu", onGlobalContextMenu);
    return () => {
      window.removeEventListener("globalcontextmenu", onGlobalContextMenu);
    };
  }, []);
  return [items, data, title, closeMenu];
}

export default useContextMenu;
