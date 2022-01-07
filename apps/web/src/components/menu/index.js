import { useAnimation } from "framer-motion";
import { Check, ChevronRight, Pro } from "../icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Flex, Box, Text, Button } from "rebass";
import useMobile from "../../utils/use-mobile";
import { AnimatedFlex } from "../animated";

function useMenuFocus(items) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const onKeyDown = useCallback(
    (e) => {
      const isSeperator = (i) => items && items[i]?.type === "seperator";
      const moveDown = (i) => (i < items.length - 1 ? ++i : 0);
      const moveUp = (i) => (i > 0 ? --i : items.length - 1);
      const hasSubmenu = (i) => items && items[i]?.hasSubmenu;
      const openSubmenu = (index) => {
        if (!hasSubmenu(index)) return;
        setIsSubmenuOpen(true);
      };

      const closeSubmenu = (index) => {
        if (!hasSubmenu(index)) return;
        setIsSubmenuOpen(false);
      };

      setFocusIndex((i) => {
        let nextIndex = i;

        switch (e.key) {
          case "ArrowUp":
            if (isSubmenuOpen) break;
            nextIndex = moveUp(i);
            if (isSeperator(nextIndex)) nextIndex = moveUp(nextIndex);
            break;
          case "ArrowDown":
            if (isSubmenuOpen) break;
            nextIndex = moveDown(i);
            if (isSeperator(nextIndex)) nextIndex = moveDown(nextIndex);
            break;
          case "ArrowRight":
            openSubmenu(i);
            break;
          case "ArrowLeft":
            closeSubmenu(i);
            break;
          default:
            break;
        }

        return nextIndex;
      });
    },
    [items, isSubmenuOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  return [focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen];
}

function Menu({ items, data, closeMenu }) {
  const isMobile = useMobile();
  const [focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen] =
    useMenuFocus(items);

  const Container = useMemo(
    () => (isMobile ? MobileMenuContainer : MenuContainer),
    [isMobile]
  );

  return (
    <Container title={data?.title}>
      {items.map((item, index) => (
        <MenuItem
          key={item.key}
          index={index}
          item={item}
          data={data}
          onClose={closeMenu}
          isFocused={focusIndex === index}
          isSubmenuOpen={focusIndex === index && isSubmenuOpen}
          onHover={() => {
            setFocusIndex(index);
            setIsSubmenuOpen((state) => {
              return item.items?.length ? true : state ? false : state;
            });
          }}
        />
      ))}
    </Container>
  );
}
export default React.memo(Menu);

function MenuContainer({ title, children }) {
  return (
    <Flex
      as="ul"
      tabIndex={-1}
      bg="background"
      py={1}
      flexDirection={"column"}
      sx={{
        position: "relative",
        listStyle: "none",
        padding: 0,
        margin: 0,
        borderRadius: "default",
        boxShadow: "0px 0px 10px 0px #00000022",
        border: "1px solid var(--border)",
        minWidth: 200,
        maxWidth: 500,
      }}
    >
      {title && (
        <Text
          fontFamily="body"
          fontSize="subtitle"
          color="primary"
          py={"8px"}
          px={3}
          sx={{ borderBottom: "1px solid", borderBottomColor: "border" }}
        >
          {title}
        </Text>
      )}
      {children}
    </Flex>
  );
}

function MobileMenuContainer({ style, id, state, title, children }) {
  const animation = useAnimation();

  useEffect(() => {
    if (state === "open") {
      animation.start({ y: 0 });
      const menu = document.getElementById(id);
      menu.style.top = 0;
      menu.style.left = 0;
    } else {
      animation.start({ y: 500 });
    }
  }, [state, animation, id]);

  return (
    <Flex
      flexDirection="column"
      id={id}
      style={style}
      width="100%"
      height="100%"
      bg="overlay"
      overflow="hidden"
      sx={{ position: "relative" }}
    >
      <AnimatedFlex
        width="100%"
        bg="background"
        sx={{
          position: "absolute",
          bottom: 0,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          overflow: "hidden",
        }}
        initial={{ y: 500 }}
        animate={animation}
        flexDirection="column"
        p={2}
      >
        <Box
          width={50}
          height={7}
          bg="shade"
          alignSelf="center"
          sx={{ borderRadius: "default" }}
        />
        <Flex flex="1" flexDirection="column" overflowY="scroll">
          <Text variant="title" mt={2} alignSelf="center">
            {title || "Properties"}
          </Text>
          {children}
        </Flex>
      </AnimatedFlex>
    </Flex>
  );
}

function MenuItem({ item, data, isFocused, isSubmenuOpen, onClose, onHover }) {
  const {
    title,
    key,
    onClick,
    color,
    items,
    icon: Icon,
    iconColor,
    type,
    tooltip,
    isDisabled,
    isChecked,
    hasSubmenu,
    isPremium,
  } = item;
  const itemRef = useRef();

  useEffect(() => {
    if (isFocused) itemRef.current?.focus();
  }, [isFocused]);

  const onAction = useCallback(
    (e) => {
      e.stopPropagation();
      if (onClose) onClose();
      onClick(data, item);
    },
    [onClick, onClose, item, data]
  );

  if (type === "seperator")
    return (
      <Box
        as="li"
        key={key}
        width="95%"
        height="0.5px"
        bg="border"
        my={2}
        alignSelf="center"
      />
    );

  return (
    <Flex
      as="li"
      flexDirection={"column"}
      flex={1}
      sx={{ position: "relative" }}
      onMouseOver={onHover}
    >
      <Button
        data-test-id={`menuitem-${title.split(" ").join("").toLowerCase()}`}
        key={key}
        ref={itemRef}
        tabIndex={-1}
        variant="menuitem"
        display="flex"
        alignItems={"center"}
        justifyContent={"space-between"}
        title={tooltip}
        disabled={isDisabled}
        onClick={onAction}
        onKeyUp={(e) => {
          if (e.key === "Enter") onAction(e);
        }}
        sx={{
          bg: isFocused ? "hover" : "transparent",
        }}
      >
        <Flex>
          {Icon && (
            <Icon color={iconColor || "text"} size={15} sx={{ mr: 2 }} />
          )}
          <Text
            as="span"
            fontFamily="body"
            fontSize="menu"
            color={color || "text"}
          >
            {title}
          </Text>
          {isPremium && <Pro size={14} color="primary" sx={{ ml: 1 }} />}
        </Flex>
        <Flex>
          {isChecked && <Check size={14} />}
          {hasSubmenu && <ChevronRight size={14} />}
        </Flex>
      </Button>
      {hasSubmenu && isSubmenuOpen && (
        <Flex
          sx={{
            position: "absolute",
            top: 0,
            left: itemRef.current?.offsetWidth,
          }}
        >
          <Menu
            items={items}
            onClose={onClose}
            data={{ ...data, parent: item, title: undefined }}
          />
        </Flex>
      )}
    </Flex>
  );
}
