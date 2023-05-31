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

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

export type CLIOptions = {
  note?: boolean | string;
  notebook?: boolean | string;
  reminder?: boolean | string;
  hidden?: boolean;
};

export async function parseArguments(): Promise<CLIOptions> {
  const result: CLIOptions = {
    note: false,
    notebook: false,
    reminder: false,
    hidden: false
  };
  const { hidden } = await yargs(hideBin(process.argv))
    .boolean("hidden")
    .command("new", "Create a new item", (yargs) => {
      return yargs
        .command("note", "Create a new note", {}, () => {
          result.note = true;
        })
        .command("notebook", "Create a new notebook", {}, () => {
          result.notebook = true;
        })
        .command("reminder", "Add a new reminder", {}, () => {
          result.reminder = true;
        });
    })
    .command("open", "Open a specific item", (yargs) => {
      return yargs
        .command(
          "note",
          "Open a note",
          { id: { string: true, description: "Id of the note" } },
          (args) => {
            result.note = args.id;
          }
        )
        .command(
          "notebook",
          "Open a notebook",
          { id: { string: true, description: "Id of the notebook" } },
          (args) => {
            result.notebook = args.id;
          }
        )
        .command(
          "topic",
          "Open a topic",
          {
            id: { string: true, description: "Id of the topic" },
            notebookId: { string: true, description: "Id of the notebook" }
          },
          (args) => {
            result.notebook = `${args.notebookId}/${args.id}`;
          }
        );
    })
    .parse();
  result.hidden = hidden;
  return result;
}
