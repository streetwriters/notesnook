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

import { Search } from "../icons";
import Field from "../field";
import { debounce } from "@notesnook/common";

function SearchBox({ onSearch }) {
  return (
    <Field
      data-test-id="search-input"
      autoFocus
      id="search"
      name="search"
      type="text"
      sx={{ m: 0, mx: 2, mt: 1, mb: 1 }}
      placeholder="Type your query here"
      onChange={debounce((e) => onSearch(e.target.value), 250)}
      action={{
        icon: Search,
        testId: "search-button",
        onClick: () => {
          const searchField = document.getElementById("search");
          if (searchField && searchField.value && searchField.value.length) {
            onSearch(searchField.value);
          }
        }
      }}
    />
  );
}
export default SearchBox;
