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

import {
  App,
  DesktopWindow,
  Menu,
  Network,
  Tray
} from "@react-native-gpui/core/desktop";
import { setJumpList } from "@react-native-gpui/system";
import { strings } from "@notesnook/intl";
import { environment } from "./environment";
import type {
  DesktopIntegration,
  LaunchRequest,
  Unsubscribe
} from "../../../platform";
import { parseLaunchArgs } from "./launch-args";

const DNS_SERVERS = [
  "https://mozilla.cloudflare-dns.com/dns-query",
  "https://dns.quad9.net/dns-query"
];

const handlers = new Set<(request: LaunchRequest) => void>();
let pending: LaunchRequest[] = [];
let argsRead = false;
let secondInstance: { remove(): void } | undefined;

function emit(request: LaunchRequest) {
  if (handlers.size === 0) pending.push(request);
  else for (const handler of handlers) handler(request);
}

function readLaunchArgs() {
  if (argsRead) return;
  argsRead = true;
  const { request } = parseLaunchArgs(App.launchArgs());
  if (request) pending.push(request);
  secondInstance = App.onSecondInstance((args) => {
    const { request } = parseLaunchArgs(args);
    if (request) emit(request);
  });
}

export function onLaunchRequest(
  handler: (request: LaunchRequest) => void
): Unsubscribe {
  readLaunchArgs();
  handlers.add(handler);
  const queued = pending;
  pending = [];
  for (const request of queued) handler(request);
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      secondInstance?.remove();
      secondInstance = undefined;
      argsRead = false;
    }
  };
}

let mainWindow: Promise<DesktopWindow> | undefined;
function main() {
  return (mainWindow ??= DesktopWindow.all().then((windows) => windows[0]));
}

async function bringToFront() {
  const window = await main();
  await window.show();
  await window.focus();
}

let trayClicks: { remove(): void } | undefined;
let trayPress: { remove(): void } | undefined;
let minimizeListener: { remove(): void } | undefined;

async function installTray(closeToTray: boolean) {
  await Tray.install({
    tooltip: "Notesnook",
    icon: require("../assets/tray-icon.png"),
    hideWindowOnClose: closeToTray,
    menu: [
      { id: "show", label: strings.showApp() },
      { type: "separator" },
      { id: "new-note", label: strings.newNote() },
      { id: "new-notebook", label: strings.newNotebook() },
      { type: "separator" },
      { id: "quit", label: strings.quit() }
    ]
  });
  trayPress?.remove();
  trayPress = Tray.onMenuPress((id) => {
    if (id === "show") bringToFront().catch(console.error);
    else if (id === "new-note") {
      bringToFront().catch(console.error);
      emit({ type: "create", item: "note" });
    } else if (id === "new-notebook") {
      bringToFront().catch(console.error);
      emit({ type: "create", item: "notebook" });
    } else if (id === "quit") App.exit(0).catch(console.error);
  });
  trayClicks?.remove();
  trayClicks = Tray.onClick(({ button, double }) => {
    if (double || button === "left") bringToFront().catch(console.error);
  });
}

async function removeTray() {
  trayPress?.remove();
  trayClicks?.remove();
  trayPress = trayClicks = undefined;
  await Tray.destroy().catch(() => {});
}

export async function applyDesktopIntegration(settings: DesktopIntegration) {
  const useTray = !!(
    settings.closeToSystemTray || settings.minimizeToSystemTray
  );
  minimizeListener?.remove();
  minimizeListener = undefined;
  if (useTray) await installTray(!!settings.closeToSystemTray);
  else await removeTray();
  if (settings.minimizeToSystemTray) {
    const window = await main();
    minimizeListener = window.addListener("stateChange", () => {
      window
        .getState()
        .then((state) => {
          if (state.isMinimized) return window.hide();
        })
        .catch(console.error);
    });
  }
}

export async function applyZoom(zoomFactor: number) {
  await (await main()).setZoomFactor(zoomFactor);
}

export async function applyTheme(change: {
  theme: "system" | "light" | "dark";
  backgroundColor?: string;
}) {
  const window = await main();
  await window.setChromeAppearance(change.theme);
  if (change.backgroundColor)
    await window.setBackgroundColor(change.backgroundColor);
}

export async function applyNetwork(options: {
  proxyRules: string;
  customDns: boolean;
}) {
  await Network.setProxy(
    options.proxyRules ? { rules: options.proxyRules } : "direct"
  );
  await Network.setDnsOverHttps(options.customDns ? DNS_SERVERS : null);
}

export function beep() {
  return App.beep();
}

export async function installMenus() {
  await Menu.setApplicationMenu([
    { type: "role", role: "appMenu" },
    { type: "role", role: "editMenu" },
    {
      type: "submenu",
      label: strings.zoom(),
      items: [
        { type: "role", role: "zoomIn" },
        { type: "role", role: "zoomOut" },
        { type: "role", role: "resetZoom" }
      ]
    },
    { type: "role", role: "windowMenu" },
    { type: "role", role: "helpMenu" }
  ]);
  await installJumpList();
  await Menu.setDockMenu([
    {
      id: "dock-new-note",
      label: strings.newNote(),
      onPress: () => emit({ type: "create", item: "note" })
    },
    {
      id: "dock-new-notebook",
      label: strings.newNotebook(),
      onPress: () => emit({ type: "create", item: "notebook" })
    }
  ]);
}

async function installJumpList() {
  if (environment.os !== "Windows") return;
  await setJumpList([
    {
      title: strings.newNote(),
      args: ["new", "note"],
      description: strings.createNewNote()
    },
    {
      title: strings.newNotebook(),
      args: ["new", "notebook"],
      description: strings.createNewNotebook()
    },
    {
      title: strings.newReminder(),
      args: ["new", "reminder"],
      description: strings.addNewReminder()
    }
  ]).catch(console.error);
}

export async function watchZoom(save: (zoomFactor: number) => void) {
  const window = await main();
  let last = (await window.getState()).zoomFactor;
  const subscription = window.addListener("stateChange", () => {
    window
      .getState()
      .then((state) => {
        if (state.zoomFactor === last) return;
        last = state.zoomFactor;
        save(state.zoomFactor);
      })
      .catch(console.error);
  });
  return () => subscription.remove();
}
