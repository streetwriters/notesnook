import React, { useEffect, useRef, useState } from "react";
import { Flex, Text } from "@streetwriters/rebass";
import * as Icon from "../icons";
import { useStore } from "../../stores/app-store";
import { CREATE_BUTTON_MAP } from "../../common";
import useMobile from "../../hooks/use-mobile";
import { navigate } from "../../navigation";
import { Input } from "@streetwriters/rebass-forms";

function RouteContainer(props) {
  const {
    id,
    type,
    title,
    isEditable,
    onChange,
    subtitle,
    buttons,
    component
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

  // if (!subtitle) return null;
  return (
    <Flex mx={2} flexDirection="column" justifyContent="center">
      <Flex alignItems="center" justifyContent="space-between">
        <Flex justifyContent="center" alignItems="center" py={2}>
          {buttons?.back ? (
            <Icon.ArrowLeft
              size={24}
              title={buttons.back.title}
              onClick={buttons.back.action}
              sx={{ flexShrink: 0, mr: 2, cursor: "pointer" }}
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
                display: ["block", "none", "none"]
              }}
              size={30}
            />
          )}
          {title && (
            <RouteTitle
              subtitle={subtitle}
              title={title}
              isEditable={isEditable}
              onChange={onChange}
            />
          )}
        </Flex>
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
                ":hover": { boxShadow: "0px 0px 5px 0px var(--dimPrimary)" }
              }}
              title={createButtonData.title}
              onClick={createButtonData.onClick}
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}

function RouteTitle({ title, subtitle, isEditable, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const ref = useRef();
  useEffect(() => {
    ref.current.value = title;
  }, [title]);

  return (
    <Flex flexDirection="column">
      {subtitle && <Text variant="subBody">{subtitle}</Text>}
      <Input
        ref={ref}
        variant="clean"
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
          fontSize: subtitle ? "subheading" : "heading",
          border: "none",
          bg: isEditing ? "bgSecondary" : "transparent",

          ":focus-visible": { outline: "none" }
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
    </Flex>
  );
}
