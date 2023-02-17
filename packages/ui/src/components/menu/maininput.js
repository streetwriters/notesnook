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
import { useEffect, useState } from "react";
import { db } from "../../common/db";
import { addToSearchHistory } from "./search";
import { Input } from "@theme-ui/components";

export function MainInput(props) {
  const [searchHistory, setSearchHistory] = useState();

  useEffect(async () => {
    //correct all the useEffects
    //history file to be added in core for search history
    let list = await db.searchHistory.getHistory();
    if (props.filters.length < 1) {
      setSearchHistory(list);
    } else {
      setSearchHistory([]);
    }
  }, [db.searchHistory, props.filters.length]);

  return (
    <Input
      {...props}
      id="general_input"
      key="general_input"
      placeholder={"Type your query here"}
      bg={"none"}
      autoFocus
      as="input"
      name="search"
      autoComplete="off"
      type="text"
      variant="clean"
      sx={{
        wordWrap: "break-word",
        minWidth: 0,
        width: 0,
        flex: 1
      }}
      onChange={async (e) => {
        props.refreshFilters(e.target.value, props.setFilters);
        props.setSuggestions(
          await props.getSuggestions(e.target.value, undefined, searchHistory)
        );
      }}
      onFocus={async (e) => {
        //shift to index
        props.setSuggestions(
          await props.getSuggestions(e.target.value, undefined, searchHistory)
        );
        props.onFocus(e);
      }}
      onKeyDown={async (e) => {
        //keyActions(e);
        props.onKeyDown(e);
        await onKeyPress[e.key](e, props);
      }}
    />
  );
}

const onKeyPress = {
  Enter: async (e, props) => {
    props.onSearch(e.target.value);
    await addToSearchHistory(e.target.value);
    props.setSuggestions([]);
    props.refreshFilters(e.target.value, props.setFilters);
    e.preventDefault();
  },
  Escape: (e, props) => {
    props.setSuggestions([]);
  },
  ArrowDown: (e, props) => {
    props.moveSelection(props.suggestions, props.setSelectionIndex).Down();
    e.preventDefault();
  },
  ArrowUp: (e, props) => {
    props.moveSelection(props.suggestions, props.setSelectionIndex).Up();
    e.preventDefault();
  },
  ArrowLeft: (e, props) => {
    if (e.target.selectionStart == 0) {
      props.focusInput(props.filters.length - 1);
      e.preventDefault();
    }
  },
  ArrowRight: (e, props) => {
    if (e.target.selectionStart == e.target.value.length) {
      props.focusInput(0);
      e.preventDefault();
    }
  },
  Backspace: (e, props) => {
    if (e.target.selectionStart == 0) {
      props.focusInput(props.filters.length - 1);
    }
  }
};
