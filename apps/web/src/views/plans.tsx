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
import { useStore as useThemeStore } from "../stores/theme-store";
import { useEffect } from "react";
import { getQueryParams, hardNavigate } from "../navigation";
import { isUserSubscribed } from "../hooks/use-is-user-premium";
import { ArrowUp, ChevronLeft, Lightning } from "../components/icons";
import Star from "../assets/star.svg";
import PlansFooter from "../assets/plans-footer.svg";

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
            <PlansCTA />
          </Flex>
        </FlexScrollContainer>
      </Flex>
    </Flex>
  );
}

function PlansCTA() {
  const colorScheme = useThemeStore((store) => store.colorScheme);
  const darkTheme = useThemeStore((store) => store.darkTheme);
  const lightTheme = useThemeStore((store) => store.lightTheme);
  const inverseBackground =
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.background
      : darkTheme.scopes.base.primary.background;
  const inverseHeading =
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.heading
      : darkTheme.scopes.base.primary.heading;
  const inverseParagraph =
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.paragraph
      : darkTheme.scopes.base.primary.paragraph;
  const inverseBackgroundSecondary =
    colorScheme === "dark"
      ? lightTheme.scopes.base.secondary.background
      : darkTheme.scopes.base.secondary.background;
  const inverseAccentForeground =
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.accentForeground
      : darkTheme.scopes.base.primary.accentForeground;
  const inverseBorder =
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.border
      : darkTheme.scopes.base.primary.border;
  const inverseParagraphSecondary =
    colorScheme === "dark"
      ? lightTheme.scopes.base.secondary.paragraph
      : darkTheme.scopes.base.secondary.paragraph;

  return (
    <>
      <Flex
        sx={{
          position: "relative",
          overflow: "hidden",
          background: inverseBackground,
          px: "spacing14",
          py: "70px"
        }}
      >
        <Image
          src={PlansFooter}
          alt=""
          sx={{
            position: "absolute",
            top: 0,
            right: 100,
            scale: 1.6,
            width: "572",
            height: "100%",
            display: ["none", "block"]
          }}
        />
        <Flex
          sx={{
            position: "relative",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: "spacing7",
            zIndex: 1
          }}
        >
          <Flex
            sx={{
              alignItems: "center",
              gap: "spacing4",
              bg: inverseBackgroundSecondary,
              borderRadius: "radius2",
              p: "spacing3"
            }}
          >
            <Lightning size={15} color={inverseAccentForeground} />
            <Text
              sx={{
                color: inverseAccentForeground,
                fontSize: "sm",
                lineHeight: 1,
                whiteSpace: "nowrap"
              }}
            >
              UNLOCK THE FULL POWER OF NOTESNOOK
            </Text>
          </Flex>
          <Flex
            sx={{
              flexDirection: "column",
              gap: "spacing9"
            }}
          >
            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "spacing3"
              }}
            >
              <Text
                sx={{
                  fontSize: "4xl",
                  lineHeight: 1.2,
                  fontWeight: 600,
                  color: inverseHeading
                }}
              >
                Your notes deserve more than basic storage
              </Text>
              <Text
                sx={{
                  color: inverseParagraph,
                  fontSize: "sm",
                  lineHeight: 1.5
                }}
              >
                Unlock encrypted syncing, larger storage, premium productivity
                features, and everything you need to write with confidence.
              </Text>
            </Flex>
            <Button
              onClick={() =>
                document
                  .getElementById("select-plan")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              variant="new_accent"
              sx={{
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "spacing3"
              }}
            >
              Choose your plan
              <ArrowUp size={15} color="accentForeground" />
            </Button>
          </Flex>
        </Flex>
      </Flex>
      <Flex
        sx={{
          alignItems: "flex-start",
          borderTop: "1px solid",
          borderColor: inverseBorder,
          flexDirection: "column",
          gap: "spacing11",
          px: "spacing14",
          py: "spacing9",
          bg: inverseBackground
        }}
      >
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%"
          }}
        >
          <Flex sx={{ alignItems: "center", gap: "spacing4" }}>
            <Text
              aria-hidden="true"
              sx={{
                color: inverseParagraphSecondary,
                fontSize: "sm",
                lineHeight: 1
              }}
            >
              ©
            </Text>
            <Text
              sx={{
                color: inverseParagraphSecondary,
                fontSize: "sm",
                lineHeight: 1,
                whiteSpace: "nowrap"
              }}
            >
              2026 Streetwriters (Private) Ltd.
            </Text>
          </Flex>
          <Flex sx={{ gap: "spacing7" }}>
            <Text
              as="a"
              href="https://notesnook.com/privacy"
              target="_blank"
              rel="noreferrer"
              sx={{
                color: inverseParagraph,
                fontSize: "sm",
                lineHeight: 1,
                textDecoration: "none",
                whiteSpace: "nowrap"
              }}
            >
              Privacy policy
            </Text>
            <Text
              as="a"
              href="https://notesnook.com/terms"
              target="_blank"
              rel="noreferrer"
              sx={{
                color: inverseParagraph,
                fontSize: "sm",
                lineHeight: 1,
                textDecoration: "none",
                whiteSpace: "nowrap"
              }}
            >
              Terms of service
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}

export default Plans;

function openURL(url: string) {
  const queryParams = getQueryParams();
  const redirect = queryParams?.redirect;
  hardNavigate(redirect || url);
}
