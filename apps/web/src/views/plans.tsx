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

import { SubscriptionPlan } from "@notesnook/core";
import {
  ComparePlans,
  Footer,
  PlansList
} from "../dialogs/buy-dialog/plan-list";
import { FlexScrollContainer } from "../components/scroll-container";
import { Button, Flex, Text } from "@theme-ui/components";
import { useStore as useUserStore } from "../stores/user-store";
import { useEffect } from "react";
import { getQueryParams, hardNavigate } from "../navigation";
import { Close } from "../components/icons";
import { isUserSubscribed } from "../hooks/use-is-user-premium";

function Plans() {
  const user = useUserStore((store) => store.user);

  useEffect(() => {
    useUserStore.getState().init();
  }, []);

  if (isUserSubscribed(user)) {
    openURL("/");
    return null;
  }

  return (
    <Flex
      id="app"
      bg="background"
      sx={{
        overflow: "hidden",
        flexDirection: "column",
        height: "100%"
      }}
    >
      <Flex variant="columnFill" sx={{ overflowY: "hidden" }}>
        <FlexScrollContainer>
          <Button
            variant="icon"
            data-test-id="close-plans"
            sx={{
              position: "absolute",
              top: 5,
              right: 5,
              borderRadius: "100%"
            }}
            onClick={() => openURL("/")}
          >
            <Close size={28} />
          </Button>
          <Flex
            sx={{
              flexDirection: "column",
              flex: 1,
              px: 25,
              height: "100vh",
              justifyContent: "center"
            }}
          >
            <Flex sx={{ flexDirection: "column", alignSelf: "center" }}>
              <Text
                id="select-plan"
                variant="heading"
                sx={{ fontSize: 32, textAlign: "center" }}
              >
                Select a plan
              </Text>
              <Text
                variant="title"
                mt={1}
                sx={{
                  fontSize: "subheading",
                  color: "heading-secondary",
                  textAlign: "center"
                }}
              >
                One subscription for a lifetime of notes.
              </Text>
            </Flex>
            <PlansList
              recommendedPlan={SubscriptionPlan.PRO}
              onPlanSelected={(plan) => {
                const url = new URLSearchParams({
                  plan: Buffer.from(JSON.stringify(plan)).toString("base64")
                });
                hardNavigate(`/checkout`, url.toString());
              }}
            />
          </Flex>
          <Flex
            sx={{
              flexDirection: "column",
              flex: 1,
              px: "20%"
            }}
          >
            <ComparePlans />
            <Footer />
          </Flex>
        </FlexScrollContainer>
      </Flex>
    </Flex>
  );
}
export default Plans;

function openURL(url: string) {
  const queryParams = getQueryParams();
  const redirect = queryParams?.redirect;
  hardNavigate(redirect || url);
}
