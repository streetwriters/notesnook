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

import "../app.css";
import { useEffect, useState } from "react";
import { Flex } from "@theme-ui/components";
import { hardNavigate, useQueryParams } from "../navigation";
import { CheckoutEventNames, initializePaddle } from "@paddle/paddle-js";
import { CLIENT_PADDLE_TOKEN } from "../dialogs/buy-dialog/paddle";
import { Loader } from "../components/loader";
import { IS_DEV } from "../dialogs/buy-dialog/helpers";

function Payments() {
  const [{ _ptxn, priceId, email, quantity }] = useQueryParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!_ptxn && !priceId) return hardNavigate("/notes");
    (async function () {
      const paddle = await initializePaddle({
        token: CLIENT_PADDLE_TOKEN,
        environment: IS_DEV ? "sandbox" : "production",
        eventCallback: (event) => {
          if (event.name === CheckoutEventNames.CHECKOUT_CLOSED)
            window.history.back();
        }
      });
      if (!paddle) return hardNavigate("/notes");

      setIsLoading(false);
      if (_ptxn) {
        paddle.Checkout.open({
          transactionId: _ptxn,
          settings: {
            displayMode: "overlay",
            allowDiscountRemoval: true,
            showAddDiscounts: true,
            showAddTaxId: true
          }
        });
      } else if (priceId) {
        paddle.Checkout.open({
          items: [
            {
              priceId,
              quantity:
                quantity && !isNaN(parseInt(quantity)) ? parseInt(quantity) : 1
            }
          ],
          customData: { email },
          customer: email
            ? {
                email
              }
            : undefined,
          settings: { displayMode: "overlay" }
        });
      }
    })();
  }, [_ptxn, priceId, email, quantity]);

  return isLoading ? (
    <Flex
      sx={{
        flex: 1,
        height: "100%",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Loader title="Loading" />
    </Flex>
  ) : null;
}
export default Payments;
