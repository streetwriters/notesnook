const SINGLE_LINE_HEIGHT = 1.4;
const DEFAULT_FONT_SIZE = 16;

const MAX_HEIGHTS = {
  note: SINGLE_LINE_HEIGHT * 6 * DEFAULT_FONT_SIZE,
  notebook: SINGLE_LINE_HEIGHT * 7 * DEFAULT_FONT_SIZE,
  generic: SINGLE_LINE_HEIGHT * 4 * DEFAULT_FONT_SIZE,
};

function getNoteHeight(item) {
  const { title, headline } = item;
  let height = SINGLE_LINE_HEIGHT * 3;
  if (title.length > 40) height += SINGLE_LINE_HEIGHT;
  if (headline.length > 0) height += SINGLE_LINE_HEIGHT;
  if (headline.length > 60) height += SINGLE_LINE_HEIGHT;
  return height * DEFAULT_FONT_SIZE;
}

function getNotebookHeight(item) {
  const { topics, description, title } = item;
  // at the minimum we will have a title and the info text
  let height = SINGLE_LINE_HEIGHT * 3; // 2.8 = 2 lines

  if (title.length > 40) {
    height += SINGLE_LINE_HEIGHT; // title has become multiline
  }

  if (topics.length > 1) {
    height += SINGLE_LINE_HEIGHT;
  }

  if (description.length > 0) {
    height += SINGLE_LINE_HEIGHT;
  }

  if (description.length > 80) {
    height += SINGLE_LINE_HEIGHT;
  }
  return height * DEFAULT_FONT_SIZE;
}

function getItemHeight(item) {
  const { title } = item;
  // at the minimum we will have a title and the info text
  let height = SINGLE_LINE_HEIGHT * 3; // 2.8 = 2 lines

  if (title.length > 40) {
    height += SINGLE_LINE_HEIGHT; // title has become multiline
  }

  return height * DEFAULT_FONT_SIZE;
}

export { getNoteHeight, getNotebookHeight, getItemHeight, MAX_HEIGHTS };
