export function findItemAndDelete(array, predicate) {
  return deleteAtIndex(array, array.findIndex(predicate));
}

export function addItem(array, item) {
  const index = array.indexOf(item);
  if (index > -1) return false;
  array.push(item);
  return true;
}

export function deleteItem(array, item) {
  return deleteAtIndex(array, array.indexOf(item));
}

export function deleteItems(array, ...items) {
  for (let item of items) {
    deleteItem(array, item);
  }
}

export function findById(array, id) {
  if (!array) return false;
  return array.find((item) => item.id === id);
}

export function hasItem(array, item) {
  if (!array) return false;
  return array.indexOf(item) > -1;
}

function deleteAtIndex(array, index) {
  if (index === -1) return false;
  array.splice(index, 1);
  return true;
}

export function toChunks(array, chunkSize) {
  let chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}
