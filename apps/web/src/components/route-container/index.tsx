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

import { PropsWithChildren, useEffect, useRef } from "react";
import { Box } from "@theme-ui/components";
import { Close, AddReminder } from "../icons";
import { useStore as useSearchStore } from "../../stores/search-store";
import useMobile from "../../hooks/use-mobile";
import { debounce, usePromise } from "@notesnook/common";
import Field from "../field";
import { strings } from "@notesnook/intl";
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
  const isSearching = useSearchStore((store) => store.isSearching);
  const query = useSearchStore((store) => store.query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== query) {
      inputRef.current.value = query || "";
    }
  }, [query]);

  useEffect(() => {
    if (isSearching) inputRef.current?.focus();
  }, [isSearching]);

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
        id="search"
        name="search"
        type="text"
        sx={{
          bg: "background",
          m: 0,
          mr: 0,

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
          if (e.key === "Escape") useSearchStore.getState().resetSearch();
          else useSearchStore.setState({ isSearching: true, searchType: type });
        }}
        rightActions={[
          {
            icon: Close,
            id: "search-action-button",
            testId: "search-button",
            onClick: () => {
              if (inputRef.current) inputRef.current.value = "";
              useSearchStore.getState().resetSearch();
            },
            hidden: !Boolean(query)
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
}
