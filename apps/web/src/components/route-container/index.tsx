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
import { ArrowLeft, Menu, Search, Plus, Close } from "../icons";
import { useStore } from "../../stores/app-store";
import { useStore as useSearchStore } from "../../stores/search-store";
import useMobile from "../../hooks/use-mobile";
import { debounce, usePromise } from "@notesnook/common";
import Field from "../field";

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
  title?: string | (() => Promise<string | undefined>);
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
  const { buttons, type } = props;
  const titlePromise = usePromise<string | undefined>(
    () => (typeof props.title === "string" ? props.title : props.title?.()),
    [props.title]
  );
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const isMobile = useMobile();
  const isSearching = useSearchStore((store) => store.isSearching);
  const query = useSearchStore((store) => store.query);

  if (isSearching)
    return (
      <Flex
        sx={{ alignItems: "center", justifyContent: "center", mx: 1, my: 1 }}
      >
        <Field
          data-test-id="search-input"
          autoFocus
          id="search"
          name="search"
          type="text"
          sx={{ m: 0, flex: 1 }}
          styles={{ input: { p: "7px" } }}
          defaultValue={query}
          placeholder="Type your query here"
          onChange={debounce(
            (e) => useSearchStore.setState({ query: e.target.value }),
            250
          )}
          action={{
            icon: Close,
            testId: "search-button",
            onClick: () =>
              useSearchStore.setState({
                isSearching: false,
                searchType: undefined
              })
          }}
        />
      </Flex>
    );

  return (
    <Flex
      className="route-container-header"
      mx={2}
      sx={{ alignItems: "center", justifyContent: "space-between" }}
    >
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
        {titlePromise.status === "fulfilled" && titlePromise.value && (
          <Text variant="heading" data-test-id="routeHeader" color="heading">
            {titlePromise.value}
          </Text>
        )}
      </Flex>
      <Flex sx={{ flexShrink: 0 }}>
        {buttons?.search && (
          <Search
            data-test-id={"open-search"}
            size={24}
            title={buttons.search.title}
            onClick={() =>
              useSearchStore.setState({ isSearching: true, searchType: type })
            }
            sx={{
              size: 24,
              cursor: "pointer"
            }}
          />
        )}
        {!isMobile && buttons?.create && (
          <Plus
            data-test-id={`${type}-action-button`}
            color="accentForeground"
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
  );
}
