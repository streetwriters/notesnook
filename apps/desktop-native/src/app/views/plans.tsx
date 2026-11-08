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
import { strings } from "@notesnook/intl";
import { shell } from "@platform";
import {
  Button,
  dataColor,
  Flex,
  ScrollContainer,
  Text,
  type ColorValue
} from "@ui";
import {
  ComparePlans,
  Footer,
  PlansList
} from "../dialogs/buy-dialog/plan-list";
import { useStore as useUserStore } from "../stores/user-store";
import { useStore as useThemeStore } from "../stores/theme-store";
import { useEffect } from "react";
import { getQueryParams, hardNavigate } from "../navigation";
import { isUserSubscribed } from "../hooks/use-is-user-premium";
import { ArrowUp, CaretRight, Lightning } from "../components/icons";

function toColor(value: string): ColorValue {
  return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)
    ? dataColor(value)
    : "background";
}

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
      testID="plans"
      sx={{
        flexDirection: "column",
        flex: 1,
        bg: "background-secondary",
        overflow: "hidden"
      }}
    >
      <ScrollContainer>
        <Flex
          sx={{
            position: "relative",
            flexDirection: "column",
            alignItems: "center",
            p: "spacing14",
            gap: "spacing13"
          }}
        >
          <Button
            onPress={() => openURL("/")}
            variant="new_bordered"
            sx={{
              flexDirection: "row",
              bg: "background",
              position: "absolute",
              top: 80,
              right: 80,
              gap: "spacing4"
            }}
          >
            {strings.skip()}
            <CaretRight size={14} color="heading" />
          </Button>
          <Flex
            sx={{
              flexDirection: "column",
              alignItems: "center",
              gap: "spacing6"
            }}
          >
            <Text
              variant="heading"
              sx={{ fontSize: "4xl", textAlign: "center" }}
            >
              {strings.notesnookPlansTitle()}
            </Text>
            <Text
              variant="body"
              sx={{
                fontSize: "sm",
                color: "paragraph",
                textAlign: "center",
                lineHeight: 1.5,
                fontWeight: 400
              }}
            >
              {strings.notesnookPlansDesc[0]()}
              {"\n"}
              {strings.notesnookPlansDesc[1]()}
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
        <Flex sx={{ flexDirection: "column", flex: 1 }}>
          <ComparePlans />
          <Footer />
          <PlansCTA onChoosePlan={() => undefined} />
        </Flex>
      </ScrollContainer>
    </Flex>
  );
}

function PlansCTA(props: { onChoosePlan: () => void }) {
  const colorScheme = useThemeStore((store) => store.colorScheme);
  const darkTheme = useThemeStore((store) => store.darkTheme);
  const lightTheme = useThemeStore((store) => store.lightTheme);
  const inverseBackground = toColor(
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.background
      : darkTheme.scopes.base.primary.background
  );
  const inverseHeading = toColor(
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.heading
      : darkTheme.scopes.base.primary.heading
  );
  const inverseParagraph = toColor(
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.paragraph
      : "#FFFFFF"
  );
  const inverseAccentForeground = toColor(
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.accentForeground
      : darkTheme.scopes.base.primary.accentForeground
  );
  const inverseBorder = toColor(
    colorScheme === "dark"
      ? lightTheme.scopes.base.primary.border
      : darkTheme.scopes.base.primary.border
  );
  const inverseParagraphSecondary = toColor(
    colorScheme === "dark"
      ? lightTheme.scopes.base.secondary.paragraph
      : darkTheme.scopes.base.secondary.paragraph
  );

  return (
    <>
      <Flex
        sx={{
          position: "relative",
          overflow: "hidden",
          bg: inverseBackground,
          px: "spacing14",
          py: "spacing14"
        }}
      >
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
              borderRadius: "radius2",
              p: "spacing3",
              border: "1px solid",
              borderColor: "border"
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
              {strings.unlockFullPowerOfNotesnook().toUpperCase()}
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
                gap: "spacing3",
                maxWidth: 650
              }}
            >
              <Text
                sx={{
                  fontSize: 50,
                  lineHeight: 1.2,
                  fontWeight: 600,
                  color: inverseHeading
                }}
              >
                {strings.notesDeserveMoreThanStorage()}
              </Text>
              <Text
                sx={{
                  color: inverseParagraph,
                  fontSize: "sm",
                  lineHeight: 1.5
                }}
              >
                {strings.notesDeserveMoreThanStorageDesc()}
              </Text>
            </Flex>
            <Button
              onPress={props.onChoosePlan}
              variant="new_accent"
              sx={{
                alignSelf: "flex-start",
                alignItems: "center",
                justifyContent: "center",
                gap: "spacing3"
              }}
            >
              {strings.chooseYourPlan()}
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
              onPress={() => shell.openUrl("https://notesnook.com/privacy")}
              sx={{
                color: inverseParagraph,
                fontSize: "sm",
                lineHeight: 1,

                whiteSpace: "nowrap"
              }}
            >
              {strings.privacyPolicy()}
            </Text>
            <Text
              onPress={() => shell.openUrl("https://notesnook.com/terms")}
              sx={{
                color: inverseParagraph,
                fontSize: "sm",
                lineHeight: 1,

                whiteSpace: "nowrap"
              }}
            >
              {strings.tos()}
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
