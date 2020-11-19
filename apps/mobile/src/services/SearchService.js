import {updateEvent} from '../components/DialogManager/recievers';
import {Actions} from '../provider/Actions';
import {db} from '../utils/DB';
import {ToastEvent} from './EventManager';

let searchInformation = {
  placeholder: 'Search all notes',
  data: [],
  type: 'notes',
};

function update(data) {
  searchInformation = data;
}

async function search(term) {
  console.log(term, term.length);
  if (!term || term.length === 0) {
    updateEvent({
      type: Actions.SEARCH_RESULTS,
      results: [],
    });
    return;
  }
  let results;
  if (!searchInformation.type) return;
  results = await db.lookup[searchInformation.type](
    searchInformation.data,
    term,
  );
  console.log(results.length);
  if (!results || results.length === 0) {
    ToastEvent.show('No search results found for ' + term, 'error');
    return;
  }
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
};
