import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {db} from '../utils/DB';

let searchInformation = {
  placeholder: 'Search in all notes',
  data: [],
  type: 'notes',
};

let keyword = null;

function update(data) {
  searchInformation = data;
}

function setTerm(term) {
  keyword = term;
}

async function search() {
  let term = keyword;
  if (!term || term.length === 0) {
    updateEvent({
      type: Actions.SEARCH_RESULTS,
      results: [],
    });
    return;
  }
  updateEvent({
    type: Actions.SEARCHING,
    searching: {
      isSearching: true,
      status: `Searching for "${term}" in ${searchInformation.title}`,
    },
  });
  let results;
  if (!searchInformation.type) return;

  results = await db.lookup[searchInformation.type](
    searchInformation.data,
    term,
  );

  if (!results || results.length === 0) {
    updateEvent({type: Actions.SEARCHING, searching: false});
    updateEvent({
      type: Actions.SEARCHING,
      searching: {
        isSearching: false,
        status: `No search results found for "${term}" in ${searchInformation.title}`,
      },
    });
    return;
  }
  updateEvent({
    type: Actions.SEARCHING,
    searching: {
      isSearching: false,
      status: null,
    },
  });
  updateEvent({
    type: Actions.SEARCH_RESULTS,
    results: results,
  });
}

function getSearchInformation() {
  return searchInformation;
}

export default {
  update,
  getSearchInformation,
  search,
  setTerm,
};
