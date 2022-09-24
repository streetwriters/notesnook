/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { Plan, PricingInfo } from "./types";
import { useEffect } from "react";

type AppleCheckoutProps = {
  user: { id: string; email: string };
  plan: Plan;
  onPriceUpdated?: (pricingInfo: PricingInfo) => void;
  onCouponApplied?: () => void;
  coupon?: string;
};
export function AppleCheckout(props: AppleCheckoutProps) {
  useEffect(() => {
    (async function () {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      console.log(window.config, props.plan.id, await window.config.products([props.plan.id]));
    })();
  }, [props]);
  return null;
}
