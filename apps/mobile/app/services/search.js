import { useSearchStore } from '../stores/use-search-store';
import { db } from '../common/database';

let prepareSearch = () => {};

let searchInformation = {
  placeholder: 'Search in all notes',
  data: [],
  type: 'notes',
  get: () => null
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
    searchstore.setSearchStatus(true, `Searching for "${term}" in ${searchInformation.title}`);
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
  if (!keyword || keyword === '') return;
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
