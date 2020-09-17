import React from "react";
import Menu from "../menu";
import useContextMenu from "../../utils/useContextMenu";

function GlobalMenuWrapper() {
  const [items, data, title, closeMenu] = useContextMenu();

  return (
    <Menu
      id="globalContextMenu"
      menuItems={items}
      data={data}
      title={title}
      style={{
        position: "absolute",
        display: "none",
        zIndex: 999,
      }}
      closeMenu={closeMenu}
    />
  );
}
export default GlobalMenuWrapper;
