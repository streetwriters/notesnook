import Menu from "../menu";
import { useMenuTrigger, useMenu, getPosition } from "../../hooks/use-menu";
import Modal from "react-modal";
import { Box } from "rebass";

function GlobalMenuWrapper() {
  const { isOpen, closeMenu } = useMenuTrigger();
  const { items, data = {} } = useMenu();
  const { positionOptions, type } = data;
  const isAutocomplete = type === "autocomplete";

  return (
    <Modal
      role="menu"
      isOpen={isOpen}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldCloseOnOverlayClick
      shouldFocusAfterRender={!isAutocomplete}
      ariaHideApp={!isAutocomplete}
      preventScroll={!isAutocomplete}
      onRequestClose={closeMenu}
      id={"globalContextMenu"}
      overlayElement={(props, contentEl) => {
        return (
          <Box
            {...props}
            style={{
              ...props.style,
              backgroundColor: isAutocomplete ? "transparent" : "unset",
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              closeMenu();
            }}
          >
            {contentEl}
          </Box>
        );
      }}
      onAfterOpen={({ contentEl: menu }) => {
        if (!menu) return;
        const menuPosition = getPosition(menu, positionOptions);
        menu.style.top = menuPosition.top + "px";
        menu.style.left = menuPosition.left + "px";
      }}
      contentElement={(props, children) => (
        <Box
          {...props}
          onKeyDown={(e) => {
            if (props.onKeyDown) props.onKeyDown(e);
            if (e.key === "Escape") {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          style={{}}
          sx={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            width: "fit-content",
            height: "fit-content",
            position: "absolute",
            backgroundColor: undefined,
            padding: 0,
            zIndex: 0,
            outline: 0,
          }}
        >
          {children}
        </Box>
      )}
      style={{
        content: {},
        overlay: {
          zIndex: 999,
          background: "transparent",
        },
      }}
    >
      <Menu
        items={items}
        data={data}
        title={data?.title}
        closeMenu={closeMenu}
      />
    </Modal>
  );
}
export default GlobalMenuWrapper;
