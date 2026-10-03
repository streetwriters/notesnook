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
import { SettingSection } from "../types";
import { accountLocalGroup } from "./account-local";
import { accountGroup } from "./account";
import { customizeGroup } from "./customize";
import { privacySecurityGroup } from "./privacy-security";
import { backRestoreGroup } from "./back-restore";
import { productivityGroup } from "./productivity";
import { helpSupportGroup } from "./help-support";
import { communityGroup } from "./community";
import { legalGroup } from "./legal";
import { aboutGroup } from "./about";

export const useSettingsData = () => {
  return React.useMemo<SettingSection[]>(
    () => [
      accountLocalGroup,
      accountGroup,
      customizeGroup,
      privacySecurityGroup,
      backRestoreGroup,
      productivityGroup,
      helpSupportGroup,
      communityGroup,
      legalGroup,
      aboutGroup
    ],
    []
  );
};
