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

import "@notesnook/core/types.js";
import EventSource from "eventsource";
import * as vscode from "vscode";
import { Storage } from "./storage";
import { Compressor } from "./compressor";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { randomBytes } from "crypto";
import { EV, EVENTS } from "@notesnook/core/common.js";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  GlobalRegistrator.register();
  globalThis.crypto = {
    randomBytes
  };

  const { default: Database } = await import("@notesnook/core");
  const storage = new Storage(context.globalState, context.secrets);
  const db = new Database(storage, EventSource, null, new Compressor());

  db.host({
    API_HOST: "https://api.notesnook.com",
    AUTH_HOST: "https://auth.streetwriters.co",
    SSE_HOST: "https://events.streetwriters.co"
  });
  console.log("KEYS", storage.getAllKeys());
  await db.init();

  db.user.getUser().then(async (user) => {
    if (user)
      vscode.commands.executeCommand(
        "setContext",
        "notesnook.isLoggedIn",
        true
      );
  });

  db.user.fetchUser().then(async (user) => {
    if (user)
      vscode.commands.executeCommand(
        "setContext",
        "notesnook.isLoggedIn",
        true
      );
  });

  EV.subscribe(EVENTS.userLoggedIn, () => {
    vscode.window.showInformationMessage("You are logged in!");
    vscode.commands.executeCommand("setContext", "notesnook.isLoggedIn", true);
  });

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "notesnook" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "notesnook.login",
    async () => {
      const email = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        title: "Your Notesnook email",
        placeHolder: "e.g. johndoe@example.com"
      });

      try {
        const { primaryMethod } = await db.user.authenticateEmail(email);

        const code = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          title: "2-factor authentication code",
          placeHolder:
            primaryMethod === "app"
              ? "Enter 6-digit 2FA code from your authenticator app."
              : primaryMethod === "sms"
              ? "Enter 6-digit 2FA code you received on your phone."
              : "Enter 6-digit 2FA code you received on your email."
        });

        if (await db.user.authenticateMultiFactorCode(code, primaryMethod)) {
          const password = await vscode.window.showInputBox({
            password: true,
            ignoreFocusOut: true,
            title: "Your Notesnook password"
          });

          await db.user.authenticatePassword(email, password);
        }
      } catch (e) {
        console.error(e);
      }
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function showSyncIndicator() {
  const sync = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0
  );
  sync.name = "Notesnook Sync Status";
  sync.text = ``;
  S;
  sync.show();
}
