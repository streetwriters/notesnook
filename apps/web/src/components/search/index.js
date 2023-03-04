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
import * as Icon from "../icons";
import "./search.css";
import Field from "../field";
import {useEffect} from "react"
import { useStore } from "../../stores/theme-store";
function SearchBox(props) {
  const search = document.getElementById("search")
  const {theme} = useStore()
  useEffect(()=>{
    if(theme === "dark"){
      search.classList.add("darkModeSearch")
    }
    else{
      search.classList.remove("darkModeSearch")
    }
  },[theme])
  return (
    <Field
      data-test-id="search-input"
      autoFocus
      id="search"
      name="search"
      type="text"
      sx={{ m: 0, mx: 1, mt: 1 }}
      placeholder="Type your query here"
      onKeyDown={(e) => {
        if (e.key === "Enter") props.onSearch(e.target.value);
      }}
      action={{
        icon: Icon.Search,
        testId: "search-button",
        onClick: () => {
          const searchField = document.getElementById("search");
          if (searchField && searchField.value && searchField.value.length) {
            props.onSearch(searchField.value);
          }
        }
      }}
    />
  );
}
export default SearchBox;
