import { useSearchStore } from '../stores/stores';
import { db } from '../utils/database';

let searchInformation = {
  placeholder: 'Search in all notes',
  data: [],
  type: 'notes'
};

let keyword = null;

function update(data) {
  searchInformation = data;
}

function setTerm(term) {
  keyword = term;
}

async function search() {
  let searchstore = useSearchStore.getState();

  let term = keyword;
  if (!term || term.length === 0) {
    searchstore.setSearchResults([]);
    return;
  }
  searchstore.setSearchStatus(true, `Searching for "${term}" in ${searchInformation.title}`);

  let results;
  if (!searchInformation.type) return;

  results = await db.lookup[searchInformation.type](searchInformation.data, term);

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

const SearchService = {
  update,
  getSearchInformation,
  search,
  setTerm
};

export default SearchService;
