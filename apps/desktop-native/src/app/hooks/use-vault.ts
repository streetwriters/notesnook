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
