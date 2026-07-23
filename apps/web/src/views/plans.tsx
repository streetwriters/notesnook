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
  FeaturedOn,
  Footer,
  PlansList,
  TestimonialsCarousel
} from "../dialogs/buy-dialog/plan-list";
import { FlexScrollContainer } from "../components/scroll-container";
import { Flex, Text, Button, Image, Box } from "@notesnook/ui";
import { useStore as useUserStore } from "../stores/user-store";
import { useEffect } from "react";
import { getQueryParams, hardNavigate } from "../navigation";
import { isUserSubscribed } from "../hooks/use-is-user-premium";
import { ChevronLeft } from "../components/icons";
import Star from "../assets/star.svg";

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
      bg="background-secondary"
      sx={{
        overflow: "hidden",
        flexDirection: "column",
        height: "100%",
        postion: "relative"
      }}
    >
      <Flex variant="columnFill" sx={{ overflowY: "hidden" }}>
        <FlexScrollContainer>
          <Flex
            sx={{
              position: "relative",
              flexDirection: "column",
              alignItems: "center",
              py: "80px",
              px: "80px",
              gap: "50px"
            }}
          >
            <Image
              src={Star}
              sx={{
                position: "absolute",
                top: 72,
                left: 146,
                width: "43px",
                height: "43px"
              }}
            />
            <Image
              src={Star}
              sx={{
                position: "absolute",
                top: 61,
                left: 959,
                width: "25px",
                height: "25px"
              }}
            />
            <Image
              src={Star}
              sx={{
                position: "absolute",
                top: 266,
                right: 229,
                width: "43px",
                height: "43px"
              }}
            />
            <Image
              src={Star}
              sx={{
                position: "absolute",
                bottom: -30,
                right: 73,
                width: "64px",
                height: "64px"
              }}
            />
            <Button
              onClick={() => openURL("/")}
              variant="new_bordered"
              sx={{
                position: "absolute",
                top: 80,
                right: 80,
                gap: "12px"
              }}
            >
              Skip
              <ChevronLeft size={14} color="heading" />
            </Button>
            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "center",
                gap: "spacing6"
              }}
            >
              <Text
                id="select-plan"
                variant="heading"
                sx={{ fontSize: "4xl", textAlign: "center" }}
              >
                Notesnook Plans
              </Text>
              <Text
                variant="body"
                sx={{
                  fontSize: "sm",
                  color: "paragraph",
                  textAlign: "center",
                  lineHeight: "1.5",
                  fontWeight: 400
                }}
              >
                Choose a plan that fits your workflow and keep your notes secure
                across every device.
                <br />
                Enjoy powerful privacy-focused features designed for
                distraction-free writing and organization.
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
          <FeaturedOn />
          <Flex
            sx={{
              flexDirection: "column",
              flex: 1
            }}
          >
            <ComparePlans />
            <TestimonialsCarousel />
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
