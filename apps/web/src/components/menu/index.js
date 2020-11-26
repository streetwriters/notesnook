import { useAnimation } from "framer-motion";
import React, { useEffect } from "react";
import { Flex, Box, Text } from "rebass";
import { SUBSCRIPTION_STATUS } from "../../common";
import { useStore as useUserStore } from "../../stores/user-store";
import useMobile from "../../utils/use-mobile";
import Animated from "../animated";

function Menu(props) {
  const isTrial = useUserStore(
    (store) => store.user?.subscription?.status === SUBSCRIPTION_STATUS.TRIAL
  );
  const isMobile = useMobile();
  const Container = isMobile ? MobileMenuContainer : MenuContainer;

  return (
    <Container {...props}>
      {props.menuItems.map(
        (item) =>
          item.visible !== false && (
            <Flex
              data-test-id={`menuitem-${item.title
                .split(" ")
                .join("")
                .toLowerCase()}`}
              key={item.title}
              onClick={async (e) => {
                e.stopPropagation();
                if (props.closeMenu) {
                  props.closeMenu();
                }

                if (!item.component) {
                  item.onClick(props.data);
                }
              }}
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              py={"8px"}
              px={3}
              sx={{
                color: item.color || "text",
                cursor: "pointer",
                ":hover": {
                  backgroundColor: "shade",
                },
              }}
            >
              {item.component ? (
                item.component
              ) : (
                <Text as="span" fontFamily="body" fontSize="menu">
                  {item.title}
                </Text>
              )}
              {item.onlyPro && !isTrial && (
                <Text
                  fontSize="body"
                  bg="primary"
                  color="static"
                  px={1}
                  sx={{ borderRadius: "default" }}
                >
                  Pro
                </Text>
              )}
            </Flex>
          )
      )}
    </Container>
  );
}
export default Menu;

function MenuContainer(props) {
  return (
    <Flex
      id={props.id}
      bg="background"
      py={1}
      style={props.style}
      sx={{
        position: "relative",
        borderRadius: "default",
        border: "2px solid",
        borderColor: "border",
        width: 180,
        ...props.sx,
      }}
    >
      <Box width="100%">
        <Text
          fontFamily="body"
          fontSize="subtitle"
          color="primary"
          py={"8px"}
          px={3}
          sx={{ borderBottom: "1px solid", borderBottomColor: "border" }}
        >
          Properties
        </Text>
        {props.children}
      </Box>
    </Flex>
  );
}

function MobileMenuContainer(props) {
  const { style, id, state } = props;
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
      <Animated.Flex
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
            Properties
          </Text>
          {props.children}
        </Flex>
      </Animated.Flex>
    </Flex>
  );
}
