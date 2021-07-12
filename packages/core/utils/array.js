export function findItemAndDelete(array, predicate) {
  return deleteAtIndex(array, array.findIndex(predicate));
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
  return array.find((item) => item.id === id);
}

function deleteAtIndex(array, index) {
  if (index === -1) return false;
  array.splice(index, 1);
  return true;
}
