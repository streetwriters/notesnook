import React from "react";
import Animated from "../animated";
import { Box, Flex, Heading, Text } from "rebass";
import * as Icon from "../icons";
import { useStore } from "../../stores/app-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { CREATE_BUTTON_MAP, SELECTION_OPTIONS_MAP } from "../../common";
import useMobile from "../../utils/use-mobile";
import { navigate } from "hookrouter";

function RouteContainer(props) {
  const { type, route, canGoBack, title, subtitle, onlyBackButton } = props;
  return (
    <Animated.Flex
      sx={{ overflow: "hidden" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeIn" }}
      exit={{ opacity: 0 }}
      flexDirection="column"
      flex="1 1 auto"
    >
      <Header
        type={type}
        canGoBack={canGoBack}
        title={title}
        subtitle={subtitle}
        onlyBackButton={onlyBackButton}
      />
      {route}
    </Animated.Flex>
  );
}

export default RouteContainer;

function Header(props) {
  const { title, subtitle, canGoBack, onlyBackButton, type } = props;
  const createButtonData = CREATE_BUTTON_MAP[type];
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const isMobile = useMobile();
  const isSelectionMode = useSelectionStore((store) => store.isSelectionMode);

  if (!onlyBackButton && !title && !subtitle) return null;
  return (
    <Flex mx={2} flexDirection="column">
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" py={2}>
          {canGoBack || onlyBackButton ? (
            <Box
              height={38}
              width={38}
              sx={{ flexShrink: 0 }}
              onClick={() => window.history.back()}
            >
              <Icon.ChevronLeft
                size={38}
                color="fontPrimary"
                data-test-id="go-back"
              />
            </Box>
          ) : (
            <Icon.Menu
              onClick={toggleSideMenu}
              sx={{
                ml: 0,
                mr: 4,
                display: [onlyBackButton ? "none" : "block", "none", "none"],
              }}
              size={28}
            />
          )}
          <Heading data-test-id="routeHeader" fontSize="heading" color={"text"}>
            {title}
          </Heading>
        </Flex>
        <SelectionOptions options={SELECTION_OPTIONS_MAP[type]} />
        {!isSelectionMode && (
          <Flex>
            {type !== "search" && (
              <Icon.Search
                size={24}
                sx={{ mr: 2 }}
                onClick={() => {
                  navigate(
                    `/search`,
                    false,
                    {
                      type,
                    },
                    true
                  );
                }}
              />
            )}

            {!isMobile && createButtonData && (
              <Icon.Plus
                color="primary"
                size={24}
                sx={{
                  bg: "bgSecondary",
                  borderRadius: "default",
                  size: 28,
                }}
                title={createButtonData.title}
                onClick={createButtonData.onClick}
              />
            )}
          </Flex>
        )}
      </Flex>
      {subtitle && (
        <Text
          variant="title"
          color="primary"
          sx={{
            marginBottom: 2,
            cursor: "normal",
          }}
        >
          {subtitle}
        </Text>
      )}
    </Flex>
  );
}

function SelectionOptions(props) {
  const { options } = props;

  const isSelectionMode = useSelectionStore((store) => store.isSelectionMode);

  if (!isSelectionMode || !options) return null;
  return (
    <Flex>
      {options.map((option) => (
        <Box
          key={option.key}
          onClick={option.onClick}
          mx={2}
          sx={{ cursor: "pointer" }}
        >
          <option.icon size={20} />
        </Box>
      ))}
    </Flex>
  );
}
