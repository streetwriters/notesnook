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

import { useCallback, useEffect, useState } from "react";
import setPrivacyMode from "../commands/set-privacy-mode";

export default function usePrivacyMode() {
  const [_privacyMode, _setPrivacyMode] = useState(false);

  useEffect(() => {
    if (!window.config) return;
    (async function () {
      _setPrivacyMode(await window.config.privacyMode());
    })();
  }, []);

  const set = useCallback((privacyMode) => {
    setPrivacyMode(privacyMode);
    _setPrivacyMode(privacyMode);
  }, []);

  return [_privacyMode, set];
}
