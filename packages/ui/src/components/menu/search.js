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

export const mainSearchEngine = async (searchType, value) => {
  //name is cumbersome
  // better name? fetchResults
  const context = store.context;
  const [lookupType, allData] = await filterItemsToType(searchType, context);
  if (lookupType !== undefined && allData !== undefined) {
    let result = await db.lookup[lookupType](allData, value);
    return { result, allData };
  } else {
    return { result: [], allData: [] };
  }
};

/*
there is mainly two types of search:
filter search
main search
filter search is again divided into two: Why not make it one?
how to search?
db.notes.all === all notes
notebooks:all the notes in the notebook
topics: all the notes in the topic
tags: all notes in the tag
dates:all notes between the dates 
notes: all notes with the word
inTitle: all notes with the word in title
the search will condense. The scope will decrease with the number of filters
*/
export const filterSearchEngine = async (definitions) => {
  //name is cumbersome
  let notes = [];
  let searchlabels = [];
  const organizingNotesFilters = ["notebook", "topic", "tag"];
  let isOrganizingNotesFilter = false;
  await db.notes.init();
  console.log("search", definitions);
  for (let definition of definitions) {
    if (organizingNotesFilters.includes(definition.type))
      isOrganizingNotesFilter = true;
  }
  for (let definition of definitions) {
    switch (definition.type) {
      case "notebook":
        //isOrganizingNotesFilter = true; //this boolean should be done seperately
        for (let topic of definition.topics) {
          for (let note of topic.notes) {
            if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
          }
        }
        break;
      case "topic":
        //isOrganizingNotesFilter = true;
        for (let note of definition.notes) {
          if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
        }
        break;
      case "tag":
        //isOrganizingNotesFilter = true;
        for (let note of definition.noteIds) {
          if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
        }
        break;
      default:
        searchlabels.push(definition);
    }
  }

  // for (let definition of definitions) { //switch statements or consts
  //   if (definition.type === "notebook") {
  //     isHigherlabelPresent = true;
  //     for (let topic of definition.topics) {
  //       for (let note of topic.notes) {
  //         if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
  //       }
  //     }
  //   } else if (definition.type === "topic") {
  //     isHigherlabelPresent = true;
  //     for (let note of definition.notes) {
  //       if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
  //     }
  //   } else if (definition.type === "tag") {
  //     isHigherlabelPresent = true;
  //     for (let note of definition.noteIds) {
  //       if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
  //     }
  //   } else if (
  //     definition.type === "before" ||
  //     definition.type === "after" ||
  //     definition.type === "during" ||
  //     definition.type === "notes" ||
  //     definition.type === "intitle"
  //   ) {
  //     searchlabels.push(definition);
  //     //notes = await dateSearch(definition.value, definition.type);
  //   }
  // }

  let result = [];
  if (searchlabels.length > 0) {
    for (let label of searchlabels) {
      if (notes.length > 0) {
        if (label.type === "notes") {
          result = await db.lookup["notes"](notes, label.value);
        } else if (label.type === "intitle") {
          result = db.lookup["_byTitle"](notes, label.value);
        } else {
          result = await dateSearchEngine(label.value, label.type, notes);
        }
      } else if (!isOrganizingNotesFilter) {
        let allNotes = db.notes.all;
        if (label.type === "notes") {
          let search = await db.lookup["notes"](allNotes, label.value);
          result.push(...search);
        } else if (label.type === "intitle") {
          let search = await db.lookup["_byTitle"](allNotes, label.value);
          result.push(...search);
        } else {
          result = await dateSearchEngine(label.value, label.type, allNotes);
        }
      }
    }
    return result;
  } else {
    return notes;
  }
};

//definitions will first be sorted in following order: nbks> topics>tags>times>notes>intitle,
// const someMethod = async (definition,notes) => {
//   await db.notes.init();
//   return {
//     notebook: () => {
//       for (let topic of definition.topics) { // noltebooks and topics will be sorted for search in one method
//         for (let note of topic.notes) {
//           if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
//         }
//       }
//     },
//     topic: () => {
//       for (let note of definition.notes) {
//         if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
//       }
//     },
//     tag: () => { //all the notes from tag will be retrived and then mathched with already present notes to sort out relevent notes
//       for (let note of definition.noteIds) {
//         if (db.notes.note(note)) notes.push(db.notes.note(note)._note);
//       }
//     },
//     before: () => {//all the notes within dates will be retrived but only those will be sorted out which match with already present notes
//       let _notes = notes === [] ? db.notes.all : notes;
//       for (let note of _notes) {
//         if (note.dateCreated < unixTime) {
//           result.push(note);
//         }
//       }
//     },
//     after: () => {},
//     during: () => {}
//   };
// };

export const dateSearchEngine = async (date, label, notes) => {
  let unixTime = new Date(date).getTime();
  let notesArc = notes ? notes : db.notes.all;
  let result = [];

  switch (label) {
    case "before":
      for (let note of notesArc) {
        if (note.dateCreated < unixTime) {
          result.push(note);
        }
      }
      break;
    case "after":
      for (let note of notesArc) {
        if (note.dateCreated > unixTime) {
          result.push(note);
        }
      }
      break;
    case "during":
      for (let note of notesArc) {
        let dateCreated = new Date(note.dateCreated);
        let noteDate = dateFormat(dateCreated).DDMMYY;
        let selectedUnix = new Date(unixTime);
        let selectedDate = dateFormat(selectedUnix).DDMMYY;
        if (noteDate === selectedDate) {
          result.push(note);
        }
      }
      break;
  }
  return result;
  // if (label === "before") {
  //   for (let note of notesArc) {
  //     if (note.dateCreated < unixTime) {
  //       result.push(note);
  //     }
  //   }
  // } else if (label === "after") {
  //   for (let note of notesArc) {
  //     if (note.dateCreated > unixTime) {
  //       result.push(note);
  //     }
  //   }
  // } else if (label === "during") {
  //   for (let note of notesArc) {
  //     let dateCreated = new Date(note.dateCreated);
  //     let noteDate =
  //       dateCreated.getDate() +
  //       "/" +
  //       dateCreated.getMonth() +
  //       "/" +
  //       dateCreated.getFullYear();
  //     let selectedUnix = new Date(unixTime);
  //     let selectedDate =
  //       selectedUnix.getDate() +
  //       "/" +
  //       selectedUnix.getMonth() +
  //       "/" +
  //       selectedUnix.getFullYear();
  //     if (noteDate === selectedDate) {
  //       result.push(note);
  //     }
  //   }
  // }
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
