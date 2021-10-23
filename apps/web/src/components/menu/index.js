import { useAnimation } from "framer-motion";
import { Check } from "../icons";
import React, { useEffect, useMemo } from "react";
import { Flex, Box, Text, Button } from "rebass";
import { useIsUserPremium } from "../../hooks/use-is-user-premium";
import useMobile from "../../utils/use-mobile";
import { AnimatedFlex } from "../animated";

function Menu(props) {
  const { menuItems, data, closeMenu, id, style, sx, state } = props;
  const isUserPremium = useIsUserPremium();
  const isMobile = useMobile();
  const Container = useMemo(
    () => (isMobile ? MobileMenuContainer : MenuContainer),
    [isMobile]
  );

  return (
    <Container id={id} title={data?.title} style={style} sx={sx} state={state}>
      {menuItems.map(
        (
          {
            title,
            key,
            onClick,
            component: Component,
            color,
            isPro,
            isNew,
            disabled,
            disableReason,
            checked,
            icon: Icon,
            type,
          },
          index
        ) =>
          type === "seperator" ? (
            <Box
              key={key}
              width="95%"
              height="0.5px"
              bg="border"
              my={2}
              alignSelf="center"
            />
          ) : (
            <Button
              variant="anchor"
              title={
                (disabled && disabled(data) && disableReason) || title(data)
              }
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
                  onClick(data, menuItems[index]);
                }
              }}
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              py={"0.7em"}
              px={3}
              sx={{
                borderRadius: 0,
                color: color || "text",
                cursor: "pointer",
                ":hover:not(:disabled)": {
                  backgroundColor: "hover",
                },
              }}
            >
              {Icon && (
                <Icon
                  color={color || "text"}
                  size={15}
                  sx={{ mr: 2, ml: -1 }}
                />
              )}
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
              {checked && <Check size={14} />}
            </Button>
          )
      )}
    </Container>
  );
}
export default React.memo(Menu, (prev, next) => {
  return prev.state === next.state;
});

function MenuContainer({ id, style, sx, title, children }) {
  return (
    <Flex
      id={id}
      bg="background"
      py={1}
      style={style}
      sx={{
        position: "relative",
        width: "11em",
        borderRadius: "default",
        boxShadow: "0px 10px 10px 0px #00000022",
        border: "1px solid",
        borderColor: "border",
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
          {title || "Properties"}
        </Text>
        {children}
      </Flex>
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
