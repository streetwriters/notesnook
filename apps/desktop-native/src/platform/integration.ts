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

import type { Unsubscribe } from "./lifecycle";

export interface DesktopIntegration {
  autoStart?: boolean;
  startMinimized?: boolean;
  minimizeToSystemTray?: boolean;
  closeToSystemTray?: boolean;
  nativeTitlebar?: boolean;
}

export type LaunchRequest =
  | { type: "create"; item: "note" | "notebook" | "reminder" }
  | { type: "open"; item: "note" | "notebook"; id: string };

export interface ThemeChange {
  theme: "system" | "light" | "dark";
  backgroundColor?: string;
  windowControlsIconColor?: string;
}

export interface Integration {
  isFlatpak(): Promise<boolean>;
  isSnap(): Promise<boolean>;
  isPortable(): Promise<boolean>;
  getDesktopIntegration(): Promise<DesktopIntegration>;
  setDesktopIntegration(settings: DesktopIntegration): Promise<void>;
  getPrivacyMode(): Promise<boolean>;
  setPrivacyMode(enabled: boolean): Promise<void>;
  getCustomDns(): Promise<boolean>;
  setCustomDns(enabled: boolean): Promise<void>;
  getZoomFactor(): Promise<number>;
  setZoomFactor(zoomFactor: number): Promise<void>;
  getProxyRules(): Promise<string>;
  setProxyRules(proxyRules: string): Promise<void>;
  getBackupDirectory(): Promise<string>;
  selectBackupDirectory(): Promise<string | undefined>;
  setAppLanguage(language: string): Promise<void>;
  changeTheme(change: ThemeChange): Promise<void>;
  getSystemTheme(): Promise<"light" | "dark">;
  onSystemThemeChanged(handler: (theme: "light" | "dark") => void): Unsubscribe;
  onOpenLink(handler: (url: string) => void): Unsubscribe;
  onLaunchRequest(handler: (request: LaunchRequest) => void): Unsubscribe;
  start(): Promise<void>;
  beep(): Promise<void>;
}
