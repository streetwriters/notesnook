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

import { SectionHeading } from "../../../components/settings-ui";
import { useEffect, useState } from "react";
import {
  CheckCircleSimple,
  Copy,
  Loading,
  Sparkle
} from "../../../components/icons";
import { Button, Link, Flex, Text, Grid } from "@theme-ui/components";
import { usePromise } from "@notesnook/common";
import { db } from "../../../common/db";
import { writeToClipboard } from "../../../utils/clipboard";
import { showToast } from "../../../utils/toast";
import { ErrorText } from "../../../components/error-text";
import { useStore as useUserStore } from "../../../stores/user-store";
import { SubscriptionPlan, SubscriptionStatus } from "@notesnook/core";
import { BuyDialog } from "../../buy-dialog";
import { strings } from "@notesnook/intl";

export function CircleHeader() {
  return (
    <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
      <SectionHeading sx={{ m: 0 }}>{strings.notesnookCircle()}</SectionHeading>
      <Flex sx={{ flexDirection: "column", gap: "spacing7" }}>
        <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
          <Text
            variant="heading"
            sx={{
              fontSize: "lg",
              fontWeight: 600,
              lineHeight: 1,
              color: "heading"
            }}
          >
            Partner offers
          </Text>
          <Text
            variant="body"
            sx={{ fontSize: "sm", lineHeight: 1.2, color: "paragraph" }}
          >
            {strings.notesnookCircleDesc()}
          </Text>
        </Flex>
        <CirclePartners />
      </Flex>
    </Flex>
  );
}

export function CirclePartners() {
  const partners = usePromise(() => db.circle.partners(), []);
  const [redeemedCode, setRedeemedCode] = useState<{
    partnerId: string;
    code: string;
  }>();
  const [copied, setCopied] = useState(false);
  const subscription = useUserStore((store) => store.user?.subscription);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const isFree =
    !subscription ||
    subscription?.plan === SubscriptionPlan.FREE ||
    subscription?.status === SubscriptionStatus.EXPIRED;
  const isTrial = subscription?.status === SubscriptionStatus.TRIAL;
  const canRedeem = !isFree && !isTrial;

  return (
    <>
      {partners.status === "pending" ? (
        <Loading />
      ) : partners.status === "rejected" ? (
        <ErrorText error={partners.reason} />
      ) : (
        <Grid columns={2} gap="spacing7" sx={{ m: 0 }}>
          {partners.value?.map((partner) => (
            <Flex
              key={partner.id}
              sx={{
                flexDirection: "column",
                border: "1px solid",
                borderColor: "border",
                borderRadius: "radius3",
                px: "spacing6",
                py: "spacing7",
                gap: "spacing7"
              }}
            >
              <Flex sx={{ flexDirection: "column", gap: "spacing5" }}>
                <Flex sx={{ alignItems: "center", gap: "spacing5" }}>
                  <img
                    src={partner.logoBase64}
                    alt={partner.name}
                    style={{
                      width: 30,
                      height: 30,
                      objectFit: "cover",
                      borderRadius: 8
                    }}
                  />
                  <Text
                    variant="heading"
                    sx={{
                      fontSize: "lg",
                      fontWeight: 600,
                      lineHeight: 1,
                      color: "heading"
                    }}
                  >
                    {partner.name}
                  </Text>
                </Flex>
                <Text
                  variant="body"
                  sx={{
                    fontSize: "sm",
                    lineHeight: 1.3,
                    color: "paragraph",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {partner.shortDescription}
                </Text>
              </Flex>
              <Flex
                sx={{
                  flexDirection: "column",
                  gap: "spacing7",
                  mt: "auto"
                }}
              >
                <Flex
                  sx={{
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "spacing3",
                    px: "spacing3",
                    py: "spacing1",
                    bg: "background-selected",
                    borderRadius: "radius1"
                  }}
                >
                  <Sparkle size={13} color="accent" sx={{ flexShrink: 0 }} />
                  <Text
                    variant="body"
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: "xs",
                      lineHeight: 1,
                      color: "accent"
                    }}
                  >
                    {partner.offerDescription}
                  </Text>
                </Flex>
                {redeemedCode?.partnerId === partner.id ? (
                  <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
                    <Flex
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "spacing4",
                        p: "spacing4",
                        bg: "background-secondary",
                        border: "1px dashed",
                        borderColor: "accent",
                        borderRadius: "radius2"
                      }}
                    >
                      <Text
                        variant="body"
                        className="selectable"
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: "xxs",
                          lineHeight: 1,
                          color: "paragraph"
                        }}
                      >
                        {redeemedCode.code}
                      </Text>

                      <Button
                        variant="secondary"
                        onClick={async () => {
                          await writeToClipboard({
                            "text/plain": redeemedCode.code
                          });
                          setCopied(true);
                        }}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: "spacing3",
                          px: "spacing3",
                          py: "spacing2",
                          color: "accent",
                          fontSize: "xs",
                          fontWeight: 600,
                          lineHeight: 1,
                          borderRadius: "radius1",
                          ":hover:not(:disabled)": { bg: "hover-secondary" }
                        }}
                      >
                        {copied ? (
                          <CheckCircleSimple size={15} color="accent" />
                        ) : (
                          <Copy size={15} color="accent" />
                        )}
                        {copied ? strings.copied() : strings.copy()}
                      </Button>
                    </Flex>
                    {partner.codeRedeemUrl ? (
                      <Text
                        variant="body"
                        sx={{
                          fontSize: "xs",
                          lineHeight: 1,
                          color: "paragraph-secondary"
                        }}
                      >
                        <Link
                          target="_blank"
                          href={partner.codeRedeemUrl.replace(
                            "{{code}}",
                            redeemedCode.code
                          )}
                          sx={{ color: "accent", textDecoration: "underline" }}
                        >
                          {strings.claimPromotion[0]()}
                        </Link>{" "}
                        {strings.claimPromotion[1]()}
                      </Text>
                    ) : null}
                  </Flex>
                ) : (
                  <Button
                    variant="secondary"
                    sx={{
                      px: "spacing5",
                      py: "spacing6",
                      bg: "background-secondary",
                      color: "heading",
                      fontSize: "md",
                      fontWeight: 600,
                      lineHeight: 1,
                      borderRadius: "radius2",
                      ":hover:not(:disabled)": { bg: "hover" }
                    }}
                    onClick={async () => {
                      if (isFree) return BuyDialog.show({});
                      if (isTrial) {
                        return showToast(
                          "error",
                          strings.trialUserCircleNotice()
                        );
                      }
                      if (!canRedeem) return;
                      const result = await db.circle
                        .redeem(partner.id)
                        .catch((e) => {
                          showToast("error", e.message);
                        });
                      if (result?.code) {
                        setCopied(false);
                        setRedeemedCode({
                          partnerId: partner.id,
                          code: result.code
                        });
                        showToast(
                          "success",
                          strings.codeRedeemedSuccessfully()
                        );
                      }
                    }}
                  >
                    {isFree ? strings.upgradeToRedeem() : strings.redeemCode()}
                  </Button>
                )}
              </Flex>
            </Flex>
          ))}
        </Grid>
      )}
    </>
  );
}
