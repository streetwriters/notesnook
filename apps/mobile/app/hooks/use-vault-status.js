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
import BiometicService from "../services/biometrics";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";
import { db } from "../common/database";

const VaultStatusCache = {
  exists: false,
  biometryEnrolled: false,
  isBiometryAvailable: false
};

export const useVaultStatus = () => {
  const [vaultStatus, setVaultStatus] = React.useState(VaultStatusCache);

  const checkVaultStatus = useCallback(() => {
    db.vault.exists().then(async (exists) => {
      let available = await BiometicService.isBiometryAvailable();
      let fingerprint = await BiometicService.hasInternetCredentials();
      if (
        VaultStatusCache.exists === exists &&
        VaultStatusCache.biometryEnrolled === fingerprint &&
        VaultStatusCache.isBiometryAvailable === available
      )
        return;
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
