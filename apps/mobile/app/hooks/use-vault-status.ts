import React, { useCallback, useEffect } from "react";
import BiometicService from "../services/biometrics";
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";
import { db } from "../common/database";

const VaultStatusCache = {
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
  const [vaultStatus, setVaultStatus] = React.useState(VaultStatusCache);

  const checkVaultStatus = useCallback(() => {
    db.vault?.exists().then(async (exists) => {
      const available = await BiometicService.isBiometryAvailable();
      const fingerprint = await BiometicService.hasInternetCredentials();
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
  }, []);

  return vaultStatus;
};
