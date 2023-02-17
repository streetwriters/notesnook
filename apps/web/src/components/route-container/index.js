/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { useEffect, useRef, useState } from "react";
import { Flex, Text } from "@theme-ui/components";
import * as Icon from "../icons";
import { useStore } from "../../stores/app-store";
import { CREATE_BUTTON_MAP } from "../../common";
import useMobile from "../../hooks/use-mobile";
import { navigate } from "../../navigation";
import { Input } from "@theme-ui/components";

function RouteContainer(props) {
  const { id, type, title, isEditable, onChange, subtitle, buttons, children } =
    props;
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
      {/* {component || <Flex id={id} sx={{ flex: 1, flexDirection: "column" }} />} */}
      {children}
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
    <Flex mx={2} sx={{ flexDirection: "column", justifyContent: "center" }}>
      <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Flex py={1} sx={{ alignItems: "center", justifyContent: "center" }}>
          {buttons?.back ? (
            <Icon.ArrowLeft
              size={24}
              title={buttons.back.title}
              onClick={buttons.back.action}
              sx={{ flexShrink: 0, mr: 2, cursor: "pointer" }}
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
        <Flex sx={{ flexShrink: 0 }}>
          {buttons?.search && (
            <Icon.Search
              data-test-id={"open-search"}
              size={24}
              title={buttons.search.title}
              onClick={() => navigate(`/search/${type}`)}
            />
          )}

          {!isMobile && createButtonData && (
            <Icon.Plus
              data-test-id={`${type}-action-button`}
              color="white"
              size={18}
              sx={{
                bg: "accent",
                ml: 2,
                borderRadius: 100,
                size: 28,
                cursor: "pointer"
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
    <Flex sx={{ flexDirection: "column" }}>
      {subtitle && <Text variant="subBody">{subtitle}</Text>}
      <Input
        ref={ref}
        variant="clean"
        data-test-id="routeHeader"
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

          ":focus-visible": { outline: "none" },
          color: "paragraph"
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
