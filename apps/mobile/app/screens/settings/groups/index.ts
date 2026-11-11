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
import React from "react";
import { useSettingStore } from "../../../stores/use-setting-store";
import { SettingSection } from "../types";
import { getAccountLocalGroup } from "./account-local";
import { getAccountGroup } from "./account";
import { getCustomizeGroup } from "./customize";
import { getPrivacySecurityGroup } from "./privacy-security";
import { getBackRestoreGroup } from "./back-restore";
import { getProductivityGroup } from "./productivity";
import { getHelpSupportGroup } from "./help-support";
import { getCommunityGroup } from "./community";
import { getLegalGroup } from "./legal";
import { getAboutGroup } from "./about";

export const getSettingsGroups = (): SettingSection[] => [
  getAccountLocalGroup(),
  getAccountGroup(),
  getCustomizeGroup(),
  getPrivacySecurityGroup(),
  getBackRestoreGroup(),
  getProductivityGroup(),
  getHelpSupportGroup(),
  getCommunityGroup(),
  getLegalGroup(),
  getAboutGroup()
];

export const useSettingsData = () => {
  const appLanguage = useSettingStore((state) => state.settings.appLanguage);
  return React.useMemo(() => getSettingsGroups(), [appLanguage]);
};
