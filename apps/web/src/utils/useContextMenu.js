import { useEffect, useRef } from "react";
import Dropdown from "../components/dropdown";

var oldOpenedMenu;

function isMouseInside(e, element) {
  if (!e || !element) return false;
  return element.contains(e.target);
}

function contextMenuHandler(event, ref, menuId) {
  if (
    isMouseInside(event, ref.current) &&
    !isMouseInside(event, oldOpenedMenu)
  ) {
    Dropdown.closeLastOpened();
    dismissMenu(oldOpenedMenu);

    event.preventDefault();
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.style.display = "block";
    positionMenu(event, menu);
    oldOpenedMenu = menu;
  }
}

function onKeyDown(event) {
  if (event.keyCode === 27) dismissMenu(oldOpenedMenu);
}

function onClick() {
  dismissMenu(oldOpenedMenu);
}

function dismissMenu(menu) {
  if (menu) menu.style.display = "none";
}

function useContextMenu(menuId) {
  const ref = useRef();
  useEffect(() => {
    const parent = ref.current;
    const handler = e => contextMenuHandler(e, ref, menuId);
    parent.addEventListener("contextmenu", handler);
    window.onkeydown = onKeyDown;
    window.onclick = onClick;
    return () => {
      parent.removeEventListener("contextmenu", handler);
    };
  });
  return [ref, onClick];
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
    x: posx - 50,
    y: posy - 100
  };
}

// updated positionMenu function
function positionMenu(e, menu) {
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
}

export default useContextMenu;
