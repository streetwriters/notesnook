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

import React, { useCallback, useEffect } from "react";
import { db } from "../common/database";
import BiometricService from "../services/biometrics";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";

const VaultStatusDefaults = {
  exists: false,
  biometryEnrolled: false,
  isBiometryAvailable: false
};

export type VaultStatusType = {
  exists: boolean;
  biometryEnrolled: boolean;
  isBiometryAvailable: boolean;
};

export const useVaultStatus = () => {
  const [vaultStatus, setVaultStatus] = React.useState(VaultStatusDefaults);

  const checkVaultStatus = useCallback(() => {
    db.vault?.exists().then(async (exists) => {
      const available = await BiometricService.isBiometryAvailable();
      const fingerprint = await BiometricService.hasInternetCredentials();
      setVaultStatus({
        exists: exists,
        biometryEnrolled: fingerprint,
        isBiometryAvailable: available ? true : false
      });
    });
  }, []);

  useEffect(() => {
    checkVaultStatus();
    eSubscribeEvent("vaultUpdated", () => checkVaultStatus());
    return () => {
      eUnSubscribeEvent("vaultUpdated", () => checkVaultStatus());
    };
  }, [checkVaultStatus]);

  return vaultStatus;
};
