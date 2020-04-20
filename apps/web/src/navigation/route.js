import React from "react";
import { Box, Flex, Heading, Text } from "rebass";
import * as Icon from "../components/icons";
import ThemeProvider from "../components/theme-provider";
import { useStore } from "../stores/app-store";

function Route(props) {
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const isSelectionMode = useStore((store) => store.isSelectionMode);
  const exitSelectionMode = useStore((store) => store.exitSelectionMode);
  const selectAll = useStore((store) => store.selectAll);
  const navigator = props.params.navigator || props.navigator;
  return (
    <ThemeProvider>
      <Flex flexDirection="column" px={2}>
        {(props.route.title || props.route.params.title) && (
          <>
            <Flex alignItems="center" justifyContent="space-between">
              <Flex alignItems="center" py={2}>
                {props.canGoBack && (
                  <Box
                    onClick={props.backAction}
                    ml={-2}
                    height={38}
                    width={38}
                  >
                    <Icon.ChevronLeft size={38} color="fontPrimary" />
                  </Box>
                )}
                <Box
                  onClick={toggleSideMenu}
                  height={38}
                  ml={-5}
                  sx={{
                    display: ["block", "none", "none"],
                  }}
                >
                  <Icon.Menu size={38} />
                </Box>
                <Heading
                  fontSize="heading"
                  color={props.route.titleColor || "text"}
                >
                  {props.route.title || props.route.params.title}
                </Heading>
              </Flex>
              {props.route.options && isSelectionMode && (
                <Flex>
                  {props.route.options.map((option) => (
                    <Box
                      key={option.icon.name}
                      onClick={option.onClick}
                      mx={2}
                      sx={{ cursor: "pointer" }}
                    >
                      <option.icon />
                    </Box>
                  ))}
                </Flex>
              )}
            </Flex>
            {props.route.params.subtitle && (
              <Text
                variant="title"
                color="primary"
                sx={{
                  marginBottom: 2,
                  cursor: isSelectionMode ? "pointer" : "normal",
                }}
              >
                {props.route.params.subtitle}
              </Text>
            )}
            {isSelectionMode && (
              <Flex alignItems="center" mb={2} sx={{ cursor: "pointer" }}>
                <Text
                  variant="title"
                  color="primary"
                  onClick={() => selectAll()}
                >
                  Select all
                </Text>
                <Text
                  ml={2}
                  variant="title"
                  color="primary"
                  onClick={() => exitSelectionMode()}
                >
                  Unselect
                </Text>
              </Flex>
            )}
          </>
        )}
      </Flex>
      {props.route.component && (
        <props.route.component navigator={navigator} {...props.params} />
      )}
    </ThemeProvider>
  );
}
export default Route;
