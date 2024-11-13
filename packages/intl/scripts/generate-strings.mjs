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

import { mkdirSync, writeFileSync } from "fs";

const DO_ACTIONS = [
  {
    action: "delete",
    label: "Delete",
    dataTypes: [
      "note",
      "item",
      "reminder",
      "notebook",
      "tag",
      "color",
      "attachment"
    ]
  },
  { action: "unpin", label: "Unpin", dataTypes: ["note", "notebook"] },
  { action: "pin", label: "Pin", dataTypes: ["note", "notebook"] },
  { action: "unpublish", label: "Unpublish", dataTypes: ["note"] },
  { action: "publish", label: "Publish", dataTypes: ["note"] },
  {
    action: "permanentlyDelete",
    label: "Permanently delete",
    dataTypes: ["attachment", "item"]
  },
  {
    action: "restore",
    label: "Restore",
    dataTypes: ["note", "notebook"]
  },
  {
    action: "edit",
    label: "Edit",
    dataTypes: ["tag", "notebook", "reminder"]
  },
  {
    action: "rename",
    label: "Rename",
    dataTypes: ["attachment", "color", "tag"]
  },
  {
    action: "remove",
    label: "Remove",
    dataTypes: ["shortcut", "color", "attachment"]
  },
  {
    action: "download",
    label: "Download",
    dataTypes: ["attachment"]
  }
];

const ACTIONS = [
  {
    action: "deleted",
    label: "deleted",
    dataTypes: ["attachment", "reminder", "tag", "note"]
  },
  {
    action: "movedToTrash",
    label: "moved to trash",
    dataTypes: ["note", "notebook"]
  },
  {
    action: "permanentlyDeleted",
    label: "permanently deleted",
    dataTypes: ["note", "notebook"]
  },
  { action: "published", label: "published", dataTypes: ["note"] },
  {
    action: "restored",
    label: "restored",
    dataTypes: ["note", "notebook", "item"]
  },
  {
    action: "edited",
    label: "edited",
    dataTypes: ["tag", "notebook"]
  },
  {
    action: "created",
    label: "created",
    dataTypes: ["notebook", "tag", "shortcut"]
  },
  {
    action: "renamed",
    label: "renamed",
    dataTypes: ["color"]
  }
];

const ACTION_CONFIRMATIONS = [
  {
    action: "delete",
    label: "delete",
    dataTypes: [
      "note",
      "item",
      "reminder",
      "notebook",
      "tag",
      "color",
      "attachment"
    ]
  },
  {
    action: "permanentlyDelete",
    label: "permanently delete",
    dataTypes: ["note", "notebook"]
  }
];

const ACTION_ERRORS = [
  {
    action: "unpublished",
    label: "unpublished",
    dataTypes: ["note"]
  },
  {
    action: "published",
    label: "published",
    dataTypes: ["note"]
  }
];

const IN_PROGRESS_ACTIONS = [
  {
    action: "deleting",
    label: "Deleting",
    dataTypes: ["note", "notebook", "attachment", "tag", "reminder"]
  }
];

const DATA_TYPES = {
  note: {
    singular: `note`,
    singularCamelCase: `Note`,
    plural: `notes`,
    pluralCamelCase: `Notes`
  },
  notebook: {
    singular: `notebook`,
    singularCamelCase: `Notebook`,
    plural: `notebooks`,
    pluralCamelCase: `Notebooks`
  },
  tag: {
    singular: `tag`,
    singularCamelCase: `Tag`,
    plural: `tags`,
    pluralCamelCase: `Tags`
  },
  reminder: {
    singular: `reminder`,
    singularCamelCase: `Reminder`,
    plural: `reminders`,
    pluralCamelCase: `Reminders`
  },
  color: {
    singular: `color`,
    singularCamelCase: `Color`,
    plural: `colors`,
    pluralCamelCase: `Colors`
  },
  attachment: {
    singular: `attachment`,
    singularCamelCase: `Attachment`,
    plural: `attachments`,
    pluralCamelCase: `Attachments`
  },
  item: {
    singular: `item`,
    singularCamelCase: `Item`,
    plural: `items`,
    pluralCamelCase: `Items`
  },
  shortcut: {
    singular: `shortcut`,
    singularCamelCase: `Shortcut`,
    plural: `shortcuts`,
    pluralCamelCase: `Shortcuts`
  }
};

const DO_ACTIONS_TEMPLATE = (action, dataTypes) => `${action}: {
    ${dataTypes}
}`;

const DATA_TYPES_TEMPLATE = (
  type,
  singularTemplate,
  pluralTemplate
) => `${type}: (count: number) => plural(count, {
  one: \`${singularTemplate}\`,
  other: \`${pluralTemplate}\`
})`;

const MODULE_TEMPLATE = (exportName, strings) =>
  `/* eslint-disable header/header */
// THIS FILE IS GENERATED. DO NOT EDIT MANUALLY.

import { t, plural } from "@lingui/macro";

export const ${exportName} = {
    ${strings}
};
`;

function generateDoActionsStrings() {
  return generateStrings(
    DO_ACTIONS,
    (action, type) => `${action} ${DATA_TYPES[type].singular}`,
    (action, type) => `${action} # ${DATA_TYPES[type].plural}`
  );
}

function generateActionsStrings() {
  return generateStrings(
    ACTIONS,
    (action, type) => `${DATA_TYPES[type].singularCamelCase} ${action}`,
    (action, type) => `# ${DATA_TYPES[type].plural} ${action}`
  );
}

function generateActionConfirmationStrings() {
  return generateStrings(
    ACTION_CONFIRMATIONS,
    (action, type) =>
      `Are you sure you want to ${action} this ${DATA_TYPES[type].singular}?`,
    (action, type) =>
      `Are you sure you to ${action} these ${DATA_TYPES[type].plural}?`
  );
}

function generateActionErrorStrings() {
  return generateStrings(
    ACTION_ERRORS,
    (action, type) =>
      `${DATA_TYPES[type].singularCamelCase} could not be ${action}`,
    (action, type) => `# ${DATA_TYPES[type].plural} could not be ${action}`
  );
}

function generateInProgressActionsStrings() {
  return generateStrings(
    IN_PROGRESS_ACTIONS,
    (action, type) => `${action} ${DATA_TYPES[type].singular}...`,
    (action, type) => `${action} # ${DATA_TYPES[type].plural}...`
  );
}

function generateStrings(actions, singular, plural) {
  let result = [];
  for (const action of actions) {
    const subResults = [];
    for (const type of action.dataTypes) {
      const actionName = action.label;
      subResults.push(
        DATA_TYPES_TEMPLATE(
          type,
          singular(actionName, type),
          plural(actionName, type)
        )
      );
    }
    result.push(DO_ACTIONS_TEMPLATE(action.action, subResults.join(",\n")));
  }
  return result.join(",\n");
}

mkdirSync("./generated/", { recursive: true });

writeFileSync(
  "./generated/do-actions.ts",
  MODULE_TEMPLATE("doActions", generateDoActionsStrings())
);

writeFileSync(
  "./generated/actions.ts",
  MODULE_TEMPLATE("actions", generateActionsStrings())
);

writeFileSync(
  "./generated/in-progress-actions.ts",
  MODULE_TEMPLATE("inProgressActions", generateInProgressActionsStrings())
);

writeFileSync(
  "./generated/action-errors.ts",
  MODULE_TEMPLATE("actionErrors", generateActionErrorStrings())
);

writeFileSync(
  "./generated/action-confirmations.ts",
  MODULE_TEMPLATE("actionConfirmations", generateActionConfirmationStrings())
);
