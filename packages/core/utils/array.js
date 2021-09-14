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

export async function diff(arr1, arr2, action) {
  let length = arr1.length + arr2.length;
  for (var i = 0; i < length; ++i) {
    var actionKey = "delete";
    var item = arr1[i];

    if (i >= arr1.length) {
      var actionKey = "insert";
      var item = arr2[i - arr1.length];
    }

    await action(item, actionKey);
  }
}

function deleteAtIndex(array, index) {
  if (index === -1) return false;
  array.splice(index, 1);
  return true;
}
