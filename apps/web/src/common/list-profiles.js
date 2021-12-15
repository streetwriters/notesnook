import { navigate } from "../navigation/";
import Note from "../components/note";
import Notebook from "../components/notebook";
import Tag from "../components/tag";
import Topic from "../components/topic";
import TrashItem from "../components/trash-item";
import {
  getItemHeight,
  getNotebookHeight,
  getNoteHeight,
  MAX_HEIGHTS,
} from "./height-calculator";
import { db } from "./db";
import { getTotalNotes } from ".";

function createProfile(item, itemHeight, estimatedItemHeight) {
  return { item, itemHeight, estimatedItemHeight };
}

const NotesProfile = createProfile(
  (index, item, context) => (
    <Note
      index={index}
      pinnable={!context}
      item={item}
      tags={getTags(item)}
      notebook={getNotebook(item.notebooks, context?.type)}
      context={context}
    />
  ),
  getNoteHeight,
  MAX_HEIGHTS.note
);

const NotebooksProfile = createProfile(
  (index, item) => (
    <Notebook index={index} item={item} totalNotes={getTotalNotes(item)} />
  ),
  getNotebookHeight,
  MAX_HEIGHTS.notebook
);

const TagsProfile = createProfile(
  (index, item) => <Tag item={item} index={index} />,
  getItemHeight,
  MAX_HEIGHTS.generic
);

const TopicsProfile = createProfile(
  (index, item, context) => (
    <Topic
      index={index}
      item={item}
      onClick={() => navigate(`/notebooks/${context.notebookId}/${item.id}`)}
    />
  ),
  getItemHeight,
  MAX_HEIGHTS.generic
);

const TrashProfile = createProfile(
  (index, item) => <TrashItem index={index} item={item} />,
  (item) => {
    if (item.itemType === "note") return getNoteHeight(item);
    else if (item.itemType === "notebook") return getNotebookHeight(item);
  },
  Math.max(MAX_HEIGHTS.note, MAX_HEIGHTS.notebook)
);

const Profiles = {
  home: NotesProfile,
  notebooks: NotebooksProfile,
  notes: NotesProfile,
  tags: TagsProfile,
  topics: TopicsProfile,
  trash: TrashProfile,
};
export default Profiles;

function getTags(item) {
  let tags = item.tags;
  if (tags)
    tags = tags.slice(0, 3).reduce((prev, curr) => {
      const tag = db.tags.tag(curr);
      if (tag) prev.push(tag);
      return prev;
    }, []);
  return tags || [];
}

function getNotebook(notebooks, contextType) {
  if (contextType === "topic" || !notebooks?.length) return;

  const noteNotebook = notebooks[0];
  const topicId = noteNotebook.topics[0];

  const notebook = db.notebooks.notebook(noteNotebook.id)?.data;
  if (!notebook) return;

  const topic = notebook.topics.find((t) => t.id === topicId);
  if (!topic) return;

  return {
    id: notebook.id,
    title: notebook.title,
    dateEdited: notebook.dateEdited,
    topic: { id: topicId, title: topic.title },
  };
}
