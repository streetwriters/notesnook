import React from "react";
import { Box, Flex, Text } from "rebass";
import * as Icon from "../icons";
import { useStore } from "../../stores/app-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { CREATE_BUTTON_MAP, SELECTION_OPTIONS_MAP } from "../../common";
import useMobile from "../../utils/use-mobile";
import { navigate } from "../../navigation";

function RouteContainer(props) {
  const { id, type, title, subtitle, buttons, component } = props;
  return (
    <>
      <Header type={type} title={title} subtitle={subtitle} buttons={buttons} />
      {component || <Flex id={id} flexDirection="column" flex={1} />}
    </>
  );
}

export default RouteContainer;

function Header(props) {
  const { title, subtitle, buttons, type } = props;
  const createButtonData = CREATE_BUTTON_MAP[type];
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const isMobile = useMobile();
  const isSelectionMode = useSelectionStore((store) => store.isSelectionMode);

  if (!title && !subtitle) return null;
  return (
    <Flex mx={2} flexDirection="column" justifyContent="center">
      <Flex alignItems="center" justifyContent="space-between">
        <Flex justifyContent="center" alignItems="center" py={2}>
          {buttons?.back ? (
            <Icon.ArrowLeft
              size={24}
              title={buttons.back.title}
              onClick={buttons.back.action}
              sx={{ flexShrink: 0, mr: 2 }}
              color="text"
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
                display: ["block", "none", "none"],
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
            {buttons?.search && (
              <Icon.Search
                size={24}
                title={buttons.search.title}
                onClick={() => navigate(`/search/${type}`)}
              />
            )}

            {!isMobile && createButtonData && (
              <Icon.Plus
                data-test-id={`${type}-action-button`}
                color="primary"
                size={24}
                sx={{
                  ml: 2,
                  border: "2px solid",
                  borderColor: "primary",
                  borderRadius: "default",
                  size: 28,
                  ":hover": { bg: "shade" },
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
