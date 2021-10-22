import React, { useEffect, useRef, useState } from "react";
import { Flex, Text } from "rebass";
import * as Icon from "../icons";
import { useStore } from "../../stores/app-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { CREATE_BUTTON_MAP, SELECTION_OPTIONS_MAP } from "../../common";
import useMobile from "../../utils/use-mobile";
import { navigate } from "../../navigation";
import { Input } from "@rebass/forms";

function RouteContainer(props) {
  const {
    id,
    type,
    title,
    isEditable,
    onChange,
    subtitle,
    buttons,
    component,
  } = props;
  return (
    <>
      <Header
        type={type}
        title={title}
        subtitle={subtitle}
        buttons={buttons}
        isEditable={isEditable}
        onChange={onChange}
      />
      {component || <Flex id={id} flexDirection="column" flex={1} />}
    </>
  );
}

export default RouteContainer;

function Header(props) {
  const { title, subtitle, onChange, buttons, type, isEditable } = props;
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
          <RouteTitle
            title={title}
            isEditable={isEditable}
            onChange={onChange}
          />
        </Flex>
        <SelectionOptions options={SELECTION_OPTIONS_MAP[type]} />
        {!isSelectionMode && (
          <Flex flexShrink={0}>
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
          notebook
          alignItems="center"
          sx={{ cursor: "pointer" }}
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
    <Flex flexShrink={0}>
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

function RouteTitle({ title, isEditable, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const ref = useRef();
  useEffect(() => {
    ref.current.value = title;
  }, [title]);

  return (
    <Input
      ref={ref}
      variant="heading"
      data-test-id="routeHeader"
      color={"text"}
      title={title}
      sx={{
        overflow: "hidden",
        textOverflow: isEditing ? "initial" : "ellipsis",
        whiteSpace: "nowrap",

        p: 0,
        m: 0,
        fontWeight: "bold",
        fontFamily: "heading",
        fontSize: "heading",
        border: "none",
        bg: isEditing ? "bgSecondary" : "transparent",

        ":focus-visible": { outline: "none" },
      }}
      onDoubleClick={(e) => {
        setIsEditing(isEditable && true);
        e.target.focus();
      }}
      onKeyUp={(e) => {
        if (e.key === "Escape") {
          e.target.value = title;
          setIsEditing(false);
        } else if (e.key === "Enter") {
          if (onChange) onChange(e.target.value);
          setIsEditing(false);
        }
      }}
      onBlur={(e) => {
        if (onChange) onChange(e.target.value);
        setIsEditing(false);
      }}
      readOnly={!isEditing}
    />
  );
}
