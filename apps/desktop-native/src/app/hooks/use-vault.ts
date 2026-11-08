import { EVENTS } from "@notesnook/core";
import { useEffect, useState } from "react";
import Vault from "../common/vault";
import { db } from "../common/db";

export function useVault() {
  const [isLocked, setIsLocked] = useState(!db.vault.unlocked);

  useEffect(() => {
    db.eventManager.subscribe(EVENTS.vaultLocked, () => setIsLocked(true));
    db.eventManager.subscribe(EVENTS.vaultUnlocked, () => setIsLocked(false));
  }, []);

  return {
    isVaultLocked: isLocked,
    lockVault: Vault.lockVault
  };
}
