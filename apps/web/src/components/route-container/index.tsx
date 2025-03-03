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

import { PropsWithChildren, useRef } from "react";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import { ArrowLeft, Menu, Search, Plus, Close, AddReminder } from "../icons";
import { useStore } from "../../stores/app-store";
import { useStore as useSearchStore } from "../../stores/search-store";
import useMobile from "../../hooks/use-mobile";
import { debounce, usePromise } from "@notesnook/common";
import Field from "../field";
import { strings } from "@notesnook/intl";
import { TITLE_BAR_HEIGHT } from "../title-bar";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { RouteResult } from "../../navigation/types";
import { CREATE_BUTTON_MAP } from "../../common";

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

export type RouteContainerProps = RouteResult;
function RouteContainer(props: PropsWithChildren<RouteContainerProps>) {
  const { children } = props;
  return (
    <>
      <Header {...props} />
      {children}
    </>
  );
}

export default RouteContainer;

function Header(props: RouteContainerProps) {
  const { type } = props;
  const titlePromise = usePromise<string | undefined>(
    () => (typeof props.title === "string" ? props.title : props.title?.()),
    [props.title]
  );
  const isMobile = useMobile();
  // const isSearching = useSearchStore((store) => store.isSearching);
  const query = useSearchStore((store) => store.query);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box
      sx={{
        bg: type === "notebook" ? "background-secondary" : "transparent",
        zIndex: 2,
        p: 1
      }}
      className="route-container-header search-container"
      data-test-id="routeHeader"
      data-header={
        titlePromise.status === "fulfilled" ? titlePromise.value || type : type
      }
    >
      <Field
        inputRef={inputRef}
        data-test-id="search-input"
        autoFocus
        id="search"
        name="search"
        variant="clean"
        type="text"
        sx={{
          bg: "background",
          m: 0,
          mr: 0,

          border: "1px solid var(--border)",
          borderRadius: "large",
          gap: 0
        }}
        styles={{
          input: {
            m: 0,
            p: "7.5px",
            fontSize: "body",
            "::placeholder": {
              textAlign: "center"
            },
            "& + .rightActions #search-action-button": {
              opacity: query ? 1 : 0
            },
            "&:focus + .rightActions #search-action-button": {
              opacity: 1
            }
          }
        }}
        defaultValue={query}
        placeholder={strings.searchInRoute(
          titlePromise.status === "fulfilled"
            ? titlePromise.value || type
            : type
        )}
        onChange={debounce(
          (e) => useSearchStore.setState({ query: e.target.value }),
          250
        )}
        onKeyUp={(e) => {
          if (e.key === "Escape")
            useSearchStore.setState({
              isSearching: false,
              searchType: undefined
            });
          else useSearchStore.setState({ isSearching: true, searchType: type });
        }}
        rightActions={[
          {
            icon: Close,
            id: "search-action-button",
            testId: "search-button",
            onClick: () => {
              if (inputRef.current) inputRef.current.value = "";
              useSearchStore.setState({
                isSearching: false,
                query: undefined,
                searchType: undefined
              });
            }
          },
          ...(type === "reminders"
            ? [
                {
                  icon: AddReminder,
                  testId: "create-reminder-button",
                  ...CREATE_BUTTON_MAP.reminders
                }
              ]
            : [])
        ]}
      />
    </Box>
  );
  // if (isSearching)
  //   return (
  //     <Flex
  //       sx={{
  //         alignItems: "center",
  //         justifyContent: "center",
  //         height: TITLE_BAR_HEIGHT,
  //         zIndex: 2,
  //         px: 1
  //       }}
  //       className="route-container-header search-container"
  //     >
  // <Field
  //   data-test-id="search-input"
  //   autoFocus
  //   id="search"
  //   name="search"
  //   variant="borderless"
  //   type="text"
  //   sx={{ m: 0, flex: 1, gap: 0 }}
  //   styles={{ input: { p: "5px", m: 0 } }}
  //   defaultValue={query}
  //   placeholder={strings.typeAKeyword()}
  //   onChange={debounce(
  //     (e) => useSearchStore.setState({ query: e.target.value }),
  //     250
  //   )}
  //   onKeyUp={(e) => {
  //     if (e.key === "Escape")
  //       useSearchStore.setState({
  //         isSearching: false,
  //         searchType: undefined
  //       });
  //   }}
  //   action={{
  //     icon: Close,
  //     testId: "search-button",
  //     onClick: () =>
  //       useSearchStore.setState({
  //         isSearching: false,
  //         searchType: undefined
  //       })
  //   }}
  // />
  //     </Flex>
  //   );

  // return (
  //   <Flex
  //     className="route-container-header"
  //     sx={{
  //       px: 1,
  //       alignItems: "center",
  //       justifyContent: "space-between",
  //       height: TITLE_BAR_HEIGHT,
  //       zIndex: 2
  //     }}
  //   >
  //     <Flex
  //       py={1}
  //       sx={{
  //         alignItems: "center",
  //         justifyContent: "center",
  //         overflow: "hidden",
  //         gap: 1
  //       }}
  //     >
  //       {buttons?.back ? (
  //         <Button
  //           {...buttons.back}
  //           data-test-id="route-go-back"
  //           sx={{ p: 0, flexShrink: 0 }}
  //         >
  //           <ArrowLeft size={20} />
  //         </Button>
  //       ) : (
  //         <Button
  //           onClick={() =>
  //             AppEventManager.publish(AppEvents.toggleSideMenu, true)
  //           }
  //           sx={{ p: 0, flexShrink: 0 }}
  //         >
  //           <Menu
  //             sx={{
  //               display: ["block", "block", "none"],
  //               size: 23
  //             }}
  //             size={24}
  //           />
  //         </Button>
  //       )}
  //       {titlePromise.status === "fulfilled" && titlePromise.value && (
  // <Text
  //   className="routeHeader"
  //   variant="heading"
  //   data-test-id="routeHeader"
  //   color="heading"
  // >
  //   {titlePromise.value}
  // </Text>
  //       )}
  //     </Flex>
  //     <Flex sx={{ flexShrink: 0, gap: 2 }}>
  //       {buttons?.search && (
  //         <Button
  //           title={buttons.search.title}
  //           onClick={() =>
  //             useSearchStore.setState({ isSearching: true, searchType: type })
  //           }
  //           data-test-id={"open-search"}
  //           sx={{ p: 0 }}
  //         >
  //           <Search
  //             size={24}
  //             sx={{
  //               size: 24
  //             }}
  //           />
  //         </Button>
  //       )}
  //       {!isMobile && buttons?.create && (
  // <Button
  //   {...buttons.create}
  //   data-test-id={`${type}-action-button`}
  //   sx={{ p: 0 }}
  // >
  //   <Plus
  //     color="accentForeground"
  //     size={18}
  //     sx={{
  //       height: 24,
  //       width: 24,
  //       bg: "accent",
  //       borderRadius: 100
  //     }}
  //   />
  // </Button>
  //       )}
  //     </Flex>
  //   </Flex>
  // );
}
