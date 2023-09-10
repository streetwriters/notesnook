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

import { useSearchStore } from "../stores/use-search-store";
import { db } from "../common/database";

let prepareSearch = () => {};

let searchInformation = {
  placeholder: "Search in all notes",
  data: [],
  type: "notes",
  get: () => []
};

let keyword = null;

function update(data) {
  searchInformation = data;
}

function setTerm(term) {
  keyword = term;
}

async function search(silent) {
  let searchstore = useSearchStore.getState();

  let term = keyword;
  if (!term || term.length === 0) {
    searchstore.setSearchResults([]);
    return;
  }
  if (!silent) {
    searchstore.setSearchStatus(
      true,
      `Searching for "${term}" in ${searchInformation.title}`
    );
  }

  let results;
  if (!searchInformation.type) return;
  let searchableData = searchInformation.get ? searchInformation.get() : [];
  results = await db.lookup[searchInformation.type](searchableData, term);

  if (!results || results.length === 0) {
    searchstore.setSearchStatus(
      false,
      `No search results found for "${term}" in ${searchInformation.title}`
    );
    searchstore.setSearchResults(results);
    return;
  }
  searchstore.setSearchStatus(false, null);
  searchstore.setSearchResults(results);
}

function getSearchInformation() {
  return searchInformation;
}

function updateAndSearch() {
  if (!keyword || keyword === "") return;
  search(true);
}

const SearchService = {
  update,
  getSearchInformation,
  search,
  setTerm,
  updateAndSearch,
  prepareSearch
};

export default SearchService;
