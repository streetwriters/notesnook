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

import { PropsWithChildren } from "react";
import { Flex, Text } from "@theme-ui/components";
import { ArrowLeft, Menu, Search, Plus } from "../icons";
import { useStore } from "../../stores/app-store";
import useMobile from "../../hooks/use-mobile";
import { navigate } from "../../navigation";

export type RouteContainerButtons = {
  search?: {
    title: string;
  };
  back?: {
    title: string;
    onClick: () => void;
  };
  create?: {
    title: string;
    onClick: () => void;
  };
};

export type RouteContainerProps = {
  type: string;
  title?: string;
  buttons?: RouteContainerButtons;
};
function RouteContainer(props: PropsWithChildren<RouteContainerProps>) {
  const { type, title, buttons, children } = props;
  return (
    <>
      <Header type={type} title={title} buttons={buttons} />
      {children}
    </>
  );
}

export default RouteContainer;

function Header(props: RouteContainerProps) {
  const { title, buttons, type } = props;
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const isMobile = useMobile();

  return (
    <Flex mx={2} sx={{ flexDirection: "column", justifyContent: "center" }}>
      <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Flex py={1} sx={{ alignItems: "center", justifyContent: "center" }}>
          {buttons?.back ? (
            <ArrowLeft
              size={24}
              {...buttons.back}
              sx={{ flexShrink: 0, mr: 2, cursor: "pointer" }}
              data-test-id="go-back"
            />
          ) : (
            <Menu
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
            <Text variant="heading" data-test-id="routeHeader" color="heading">
              {title}
            </Text>
          )}
        </Flex>
        <Flex sx={{ flexShrink: 0 }}>
          {buttons?.search && (
            <Search
              data-test-id={"open-search"}
              size={24}
              title={buttons.search.title}
              onClick={() => navigate(`/search/${type}`)}
            />
          )}
          {!isMobile && buttons?.create && (
            <Plus
              data-test-id={`${type}-action-button`}
              color="white"
              size={18}
              sx={{
                bg: "accent",
                ml: 2,
                borderRadius: 100,
                size: 28,
                cursor: "pointer",
                ":hover": { boxShadow: "0px 0px 5px 0px var(--accent)" }
              }}
              {...buttons.create}
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
