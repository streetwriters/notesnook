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

import { useEffect } from "react";
import { strings } from "@notesnook/intl";
import { Flex } from "@ui";
import { hardNavigate, useQueryParams } from "../navigation";
import { Loader } from "../components/loader";
import { notImplemented } from "../common/not-implemented";

function Payments() {
  const [{ _ptxn, priceId }] = useQueryParams();

  useEffect(() => {
    if (!_ptxn && !priceId) return hardNavigate("/notes");
    notImplemented("PaddleCheckoutOverlay")();
  }, [_ptxn, priceId]);

  return (
    <Flex
      sx={{
        flex: 1,
        height: "100%",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Loader title={strings.loading()} />
    </Flex>
  );
}
export default Payments;
