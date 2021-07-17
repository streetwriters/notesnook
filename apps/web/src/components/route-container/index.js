import React from "react";
import { Flex, Text } from "rebass";
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
  const selectAll = useSelectionStore((store) => store.selectAll);
  const shouldSelectAll = useSelectionStore((store) => store.shouldSelectAll);
  const toggleSelectionMode = useSelectionStore(
    (store) => store.toggleSelectionMode
  );

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
              onClick={() => toggleSideMenu(true)}
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
                color="static"
                size={18}
                sx={{
                  bg: "primary",
                  ml: 2,
                  borderRadius: 100,
                  size: 28,
                  ":hover": { boxShadow: "0px 0px 5px 0px var(--dimPrimary)" },
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
      {isSelectionMode && (
        <Flex
          mb={2}
          sx={{
            cursor: "pointer",
          }}
          alignItems="center"
          onClick={() => {
            if (shouldSelectAll) toggleSelectionMode(false);
            else selectAll();
          }}
        >
          <Icon.Select size={16} sx={{ mr: 1 }} />
          <Text variant="body">
            {shouldSelectAll ? "Unselect all" : "Select all"}
          </Text>
        </Flex>
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
        <option.icon
          title={option.title}
          size={20}
          key={option.key}
          onClick={option.onClick}
          sx={{ cursor: "pointer", mx: 2 }}
        />
      ))}
    </Flex>
  );
}
