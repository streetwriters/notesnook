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
import { store } from "../../stores/note-store";
import { db } from "../../common/db";
import { filter, parse } from "liqe";

export const mainSearchEngine = async (filter, query) => {
  //name is cumbersome
  // better name? fetchResults
  const context = store.context;
  const [lookupType, allData] = await filterItemsToType(filter, context);
  if (lookupType !== undefined && allData !== undefined) {
    let result = await db.lookup[lookupType](allData, query);
    return { result, allData };
  } else {
    return { result: [], allData: [] };
  }
};

//first search result =>some result=> newNotes.length = 0 =>comparing should be skipped => notes = _notes
//                    =>no result  => newNotes.length = 0 =>comparing should be skipped => notes = _notes
// 2nd search result => first result some => some matches => result will be newNotes
//                                        => no matches =>  result will be notes = _notes
//                   => first result none => the same as first => result will be notes = _notes
export const filterSearchEngine = async (definitions) => {
  //name is cumbersome
  let notes = [];
  await db.notes.init();
  console.log("search", definitions);
  let index = 0;
  for (let definition of definitions) {
    let _notes = await beginSearch(definition, definition.type);
    let newNotes = [];
    for (let note of notes) {
      for (let _note of _notes) {
        if (JSON.stringify(note) == JSON.stringify(_note)) newNotes.push(note);
      }
    }
    if (index > 0 && notes.length > 0) notes = [];
    if (index === 0) notes = _notes;
    console.log("search", newNotes, notes);
    notes.push(...newNotes);
    index++;
  }
  return notes;
};

const beginSearch = async (definition, type) => {
  console.log("beginSearch", definition);
  let notes = [];
  type = type.trim();
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  db.notebooks.notebook();
=======

>>>>>>> Stashed changes
=======

>>>>>>> Stashed changes
  switch (type) {
    case "notebook": {
      console.log("beginSearch", definition.topics);
      for (let topic of definition.topics) {
        console.log("beginSearch notebook", topic);
        for (let note of db.notebooks
          .notebook(topic.notebookId)
          .topics.topic(topic.id).all) {
          if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
        }
      }
      console.log("beginSearch notebook", notes);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
      return notes;
    }
    case "notes": {
      console.log("beginSearch notes", notes);
      let allNotes = db.notes.all;
      let notes = await db.lookup["notes"](allNotes, definition.value);
<<<<<<< Updated upstream
      return notes;
    }
=======
      return notes;
    }
    case "notes": {
      console.log("beginSearch notes", notes);
      let allNotes = db.notes.all;
      let notes = await db.lookup["notes"](allNotes, definition.value);
      return notes;
    }
>>>>>>> Stashed changes
=======
      return notes;
    }
>>>>>>> Stashed changes
    case "topic": {
      for (let note of definition.notes) {
        if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
      }
      console.log("beginSearch topic", notes);
      return notes;
    }
    case "tag": {
      for (let note of definition.noteIds) {
        if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
      }
      console.log("beginSearch tag", notes);
      return notes;
    }
    case "intitle": {
      let allNotes = db.notes.all;
      notes = db.lookup["_byTitle"](allNotes, definition.value);
      console.log("beginSearch intitle", notes);
      return notes;
    }
    case "before": {
      let unixTime = standardDate(definition.value).getTime();
      let _notes = db.notes.all;
      for (let note of _notes) {
        if (note.dateCreated < unixTime) {
          notes.push(note);
        }
      }
      return notes;
    }
    case "during": {
      let unixTime = standardDate(definition.value).getTime();
      let _notes = db.notes.all;
      console.log("beginSearch before", definition.value, unixTime, _notes);
      for (let note of _notes) {
        let dateCreated = new Date(note.dateCreated);
        let noteDate = dateFormat(dateCreated).DDMMYY;
        let selectedUnix = new Date(unixTime);
        let selectedDate = dateFormat(selectedUnix).DDMMYY;
        if (noteDate === selectedDate) {
          notes.push(note);
        }
      }
      console.log("beginSearch during", notes);
      return notes;
    }
    case "after": {
      let unixTime = standardDate(definition.value).getTime();
      let _notes = db.notes.all;
      console.log("beginSearch before", definition.value, unixTime, _notes);
      for (let note of _notes) {
        if (note.dateCreated > unixTime) {
          notes.push(note);
        }
      }
      console.log("beginSearch after", notes);
      return notes;
    }
    default:
      break;
  }
};

const dateFormat = (date) => {
  //this should be someplace else
  return {
    DDMMYY: date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear()
  };
};

export async function filterItemsToType(type, context) {
  switch (type) {
    case "notes":
      await db.notes.init();
      if (!context) return ["notes", db.notes.all];
      const notes = context.notes;
      return ["notes", notes];
    case "notebooks":
      return ["notebooks", db.notebooks.all];
    case "topics":
      const notebooks = db.notebooks.all;
      if (!notebooks) return ["topics", []];
      let topics = [];
      for (let notebook of notebooks) {
        let notebookTopics = db.notebooks.notebook(notebook.id).topics.all;
        if (notebookTopics.length > 0) {
          for (let notebookTopic of notebookTopics) {
            topics.push(notebookTopic);
          }
        }
      }
      return ["topics", topics];
    case "tags":
      return ["tags", db.tags.all];
    case "trash":
      return ["trash", db.trash.all];
    case "_byTitle":
      await db.notes.init();
      if (!context) return ["notes", db.notes.all];
      let title = context.notes;
      return ["_byTitle", title];
    default:
      return [];
  }
}

export function filterItems(query, items) {
  //naming is wrong
  //this is fetch suggestions search
  try {
    return filter(
      parse(`text:"${query.toLowerCase()}"`),
      items.map((item) => {
        return { item, text: item.query };
      })
    ).map((v) => {
      return v.item.query;
    });
  } catch {
    return [];
  }
}

export const addToSearchHistory = async (value) => {
  // const history = await db.searchHistory.getHistory();
  // value = value.trim();
  // let isValueAlreadyPresent = false;
  // history.map((item) => {
  //   if (item.query === value) {
  //     isValueAlreadyPresent = true;
  //   }
  // });
  // if (isValueAlreadyPresent) {
  //   return;
  // }
  // await db.searchHistory.add(value);
};

const standardDate = (date) => {
  const [day, month, year] = date.split("/");
  return new Date(year, month - 1, day);
};
