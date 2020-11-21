import React from "react";
import Animated from "../animated";
import { Box, Flex, Text } from "rebass";
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
      transition={{ duration: 0.3, ease: "easeIn" }}
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
    <Flex mx={2} flexDirection="column" justifyContent="center">
      <Flex alignItems="center" justifyContent="space-between">
        <Flex justifyContent="center" alignItems="center" py={2}>
          {canGoBack || onlyBackButton ? (
            <Icon.ArrowLeft
              size={24}
              onClick={() => window.history.back()}
              sx={{ flexShrink: 0, mr: 2 }}
              color="fontPrimary"
              data-test-id="go-back"
            />
          ) : (
            <Icon.Menu
              onClick={toggleSideMenu}
              sx={{
                flexShrink: 0,
                ml: 0,
                mr: 4,
                mt: 1,
                display: [onlyBackButton ? "none" : "block", "none", "none"],
              }}
              size={30}
            />
          )}
          <Text variant="heading" data-test-id="routeHeader" color={"text"}>
            {title}
          </Text>
        </Flex>
        <SelectionOptions options={SELECTION_OPTIONS_MAP[type]} />
        {!isSelectionMode && (
          <Flex>
            {type !== "search" && (
              <Icon.Search
                size={24}
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
                  ml: 2,
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
