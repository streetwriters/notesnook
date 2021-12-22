export const migrations = {
  5.0: {},
  5.1: {},
  5.2: {
    note: replaceDateEditedWithDateModified(),
    notebook: replaceDateEditedWithDateModified(),
    tag: replaceDateEditedWithDateModified(true),
    attachment: replaceDateEditedWithDateModified(true),
    trash: replaceDateEditedWithDateModified(),
    tiny: replaceDateEditedWithDateModified(),
    settings: replaceDateEditedWithDateModified(true),
  },
  5.3: {
    note: false,
    notebook: false,
    tag: false,
    attachment: false,
    trash: false,
    tiny: false,
    settings: false,
  },
};

function replaceDateEditedWithDateModified(removeDateEditedProperty = false) {
  return function (item) {
    item.dateModified = item.dateEdited;
    if (removeDateEditedProperty) delete item.dateEdited;
    delete item.persistDateEdited;
    return item;
  };
}
