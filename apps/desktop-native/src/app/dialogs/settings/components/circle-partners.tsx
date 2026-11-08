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

import { useState } from "react";
import { Button, Flex, Grid, Image, Text } from "@ui";
import { Copy, Loading } from "../../../components/icons";
import { usePromise } from "@notesnook/common";
import { db } from "../../../common/db";
import { writeToClipboard } from "../../../utils/clipboard";
import { showToast } from "../../../utils/toast";
import { ErrorText } from "../../components/error-text";
import { LinkText } from "../../components/link-text";
import { useStore as useUserStore } from "../../../stores/user-store";
import { SubscriptionPlan, SubscriptionStatus } from "@notesnook/core";
import { BuyDialog } from "../../buy-dialog";
import { strings } from "@notesnook/intl";

export function CirclePartners() {
  const partners = usePromise(() => db.circle.partners(), []);
  const [redeemedCode, setRedeemedCode] = useState<{
    partnerId: string;
    code: string;
  }>();
  const subscription = useUserStore((store) => store.user?.subscription);
  const isFree =
    !subscription ||
    subscription?.plan === SubscriptionPlan.FREE ||
    subscription?.status === SubscriptionStatus.EXPIRED;
  const isTrial = subscription?.status === SubscriptionStatus.TRIAL;
  const canRedeem = !isFree && !isTrial;

  return (
    <Flex sx={{ flexDirection: "column" }}>
      {partners.status === "pending" ? (
        <Loading sx={{ mt: 2 }} />
      ) : partners.status === "rejected" ? (
        <ErrorText error={partners.reason as Error} />
      ) : (
        <Grid columns={2} sx={{ mt: 2 }}>
          {partners.value?.map((partner) => (
            <Flex
              key={partner.id}
              sx={{
                flexDirection: "column",
                border: "1px solid",
                borderColor: "border",
                borderRadius: "dialog",
                padding: 2,
                gap: 1
              }}
            >
              <Flex
                sx={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Text variant="title">{partner.name}</Text>
                <Image
                  src={partner.logoBase64}
                  alt={partner.name}
                  sx={{ width: 30, height: 30, borderRadius: 8 }}
                />
              </Flex>
              <Text variant="body" sx={{ whiteSpace: "pre-wrap" }}>
                {partner.shortDescription}
              </Text>
              <Text
                variant="subBody"
                sx={{
                  fontStyle: "italic",
                  color: "accent",
                  textAlign: "center"
                }}
              >
                {partner.offerDescription}
              </Text>
              {redeemedCode?.partnerId === partner.id ? (
                <Flex sx={{ flexDirection: "column", gap: 1 }}>
                  <Flex
                    sx={{
                      bg: "background-secondary",
                      border: "1px solid",
                      borderColor: "border",
                      borderRadius: "default",
                      alignSelf: "center",
                      alignItems: "center",
                      flexDirection: "row",
                      gap: 1,
                      p: "small"
                    }}
                  >
                    <Text
                      variant="body"
                      selectable
                      sx={{ fontFamily: "monospace", fontSize: 14 }}
                    >
                      {redeemedCode.code}
                    </Text>
                    <Button
                      variant="icon"
                      onPress={() =>
                        writeToClipboard({ "text/plain": redeemedCode.code })
                      }
                    >
                      <Copy size={12} />
                    </Button>
                  </Flex>
                  {partner.codeRedeemUrl ? (
                    <Text variant="subBody" sx={{ textAlign: "center" }}>
                      <LinkText
                        href={partner.codeRedeemUrl.replace(
                          "{{code}}",
                          redeemedCode.code
                        )}
                      >
                        {strings.claimPromotion[0]()}
                      </LinkText>{" "}
                      {strings.claimPromotion[1]()}
                    </Text>
                  ) : null}
                </Flex>
              ) : (
                <Button
                  variant="accent"
                  sx={{ mt: 1 }}
                  onPress={async () => {
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
                      setRedeemedCode({
                        partnerId: partner.id,
                        code: result.code
                      });
                      showToast("success", strings.codeRedeemedSuccessfully());
                    }
                  }}
                >
                  <Text>
                    {isFree ? strings.upgradeToRedeem() : strings.redeemCode()}
                  </Text>
                </Button>
              )}
            </Flex>
          ))}
        </Grid>
      )}
    </Flex>
  );
}
