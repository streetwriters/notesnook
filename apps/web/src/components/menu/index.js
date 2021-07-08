import { useAnimation } from "framer-motion";
import React, { useEffect, useMemo } from "react";
import { Flex, Box, Text, Button } from "rebass";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import useMobile from "../../utils/use-mobile";
import Animated from "../animated";

function Menu(props) {
  const { menuItems, data, closeMenu, id, style, sx, state } = props;
  const isUserPremium = useIsUserPremium();
  const isMobile = useMobile();
  const Container = useMemo(
    () => (isMobile ? MobileMenuContainer : MenuContainer),
    [isMobile]
  );

  return (
    <Container id={id} style={style} sx={sx} state={state}>
      {menuItems.map(
        ({
          title,
          key,
          onClick,
          component: Component,
          color,
          isPro,
          isNew,
          disabled,
          disableReason,
          icon: Icon,
        }) => (
          <Button
            variant="anchor"
            title={disableReason || title(data)}
            disabled={disabled && disabled(data)}
            data-test-id={`menuitem-${title(data)
              .split(" ")
              .join("")
              .toLowerCase()}`}
            key={key}
            onClick={async (e) => {
              e.stopPropagation();
              if (closeMenu) {
                closeMenu();
              }

              if (!Component) {
                onClick(data);
              }
            }}
            display="flex"
            flexDirection="row"
            alignItems="center"
            py={"0.7em"}
            px={3}
            sx={{
              borderRadius: 0,
              color: color || "text",
              cursor: "pointer",
              ":hover:not(:disabled)": {
                backgroundColor: "shade",
              },
            }}
          >
            {Icon && <Icon color={color || "text"} size={16} sx={{ mr: 1 }} />}
            {Component ? (
              <Component data={data} />
            ) : (
              <Text
                as="span"
                textAlign="left"
                fontFamily="body"
                fontSize="menu"
                flex={1}
              >
                {title(data)}
              </Text>
            )}
            {isPro && !isUserPremium && (
              <Text
                fontSize="subBody"
                bg="primary"
                color="static"
                px={1}
                sx={{ borderRadius: "default" }}
              >
                Pro
              </Text>
            )}
            {isNew && (
              <Text
                fontSize="subBody"
                bg="primary"
                color="static"
                px={1}
                sx={{ borderRadius: "default" }}
              >
                NEW
              </Text>
            )}
          </Button>
        )
      )}
    </Container>
  );
}
export default React.memo(Menu, (prev, next) => {
  return prev.state === next.state;
});

function MenuContainer({ id, style, sx, children }) {
  return (
    <Flex
      id={id}
      bg="background"
      py={1}
      style={style}
      sx={{
        position: "relative",
        borderRadius: "default",
        border: "2px solid",
        borderColor: "border",
        width: "11em",
        ...sx,
      }}
    >
      <Flex flexDirection="column" width="100%">
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
        {children}
      </Flex>
    </Flex>
  );
}

function MobileMenuContainer({ style, id, state, children }) {
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
          {children}
        </Flex>
      </Animated.Flex>
    </Flex>
  );
}
