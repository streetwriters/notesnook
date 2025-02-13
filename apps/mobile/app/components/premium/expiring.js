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

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { usePricing } from "../../hooks/use-pricing";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import PremiumService from "../../services/premium";
import { useThemeColors } from "@notesnook/theme";
import {
  eOpenPremiumDialog,
  eOpenResultDialog,
  eOpenTrialEndingDialog
} from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { sleep } from "../../utils/time";
import BaseDialog from "../dialog/base-dialog";
import DialogContainer from "../dialog/dialog-container";
import { Button } from "../ui/button";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { CompactFeatures } from "./compact-features";
import { Offer } from "./offer";

export const Expiring = () => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState({
    title: "Your trial is ending soon",
    offer: "Get 30% off",
    extend: true
  });
  const pricing = usePricing("yearly");
  const promo =
    status.offer && pricing?.info
      ? {
          promoCode:
            pricing?.info?.discount > 30
              ? pricing.info.sku
              : "com.streetwriters.notesnook.sub.yr.trialoffer",
          text: `GET ${
            pricing?.info?.discount > 30 ? pricing?.info?.discount : 30
          }% OFF on yearly`,
          discount: pricing?.info?.discount > 30 ? pricing?.info?.discount : 30
        }
      : null;

  useEffect(() => {
    eSubscribeEvent(eOpenTrialEndingDialog, open);
    return () => {
      eUnSubscribeEvent(eOpenTrialEndingDialog, open);
    };
  }, []);

  const open = (status) => {
    setStatus(status);
    setVisible(true);
  };

  return (
    visible && (
      <BaseDialog
        onRequestClose={() => {
          setVisible(false);
        }}
      >
        <DialogContainer>
          <View
            style={{
              width: "100%",
              alignItems: "center"
            }}
          >
            <View
              style={{
                paddingHorizontal: 12,
                width: "100%"
              }}
            >
              <Heading
                textBreakStrategy="balanced"
                style={{
                  textAlign: "center",
                  paddingTop: 18
                }}
              >
                {status.title}
              </Heading>
              <Seperator />
              <View
                style={{
                  width: "100%",
                  alignItems: "center"
                }}
              >
                {status.offer ? (
                  <>
                    <Offer padding={20} off={promo?.discount || 30} />
                  </>
                ) : (
                  <>
                    <Paragraph
                      textBreakStrategy="balanced"
                      style={{
                        textAlign: "center",
                        paddingTop: 0,
                        paddingBottom: 20
                      }}
                      size={AppFontSize.md + 2}
                    >
                      Upgrade now to continue using all the pro features after
                      your trial ends
                    </Paragraph>
                  </>
                )}

                <CompactFeatures />

                <Paragraph
                  onPress={async () => {
                    setVisible(false);
                    await sleep(300);
                    eSendEvent(eOpenPremiumDialog, promo);
                  }}
                  size={AppFontSize.xs}
                  style={{
                    textDecorationLine: "underline",
                    color: colors.secondary.paragraph,
                    marginTop: 10
                  }}
                >
                  {"See what's included in Basic & Pro plans"}
                </Paragraph>

                <Seperator />
              </View>
            </View>

            <View
              style={{
                backgroundColor: colors.secondary.background,
                width: "100%",
                borderBottomRightRadius: 10,
                borderBottomLeftRadius: 10
              }}
            >
              <Button
                type="transparent"
                title="Subscribe now"
                onPress={async () => {
                  setVisible(false);
                  await sleep(300);
                  PremiumService.sheet(
                    null,
                    promo?.discount > 30 ? null : promo
                  );
                }}
                fontSize={AppFontSize.md + 2}
                style={{
                  marginBottom: status.extend ? 0 : 10,
                  marginTop: 10,
                  paddingHorizontal: 24
                }}
              />

              {status.extend && (
                <Button
                  type="plain"
                  title="Not sure yet? Extend trial for 7 days"
                  textStyle={{
                    textDecorationLine: "underline"
                  }}
                  onPress={async () => {
                    setVisible(false);
                    await sleep(300);
                    eSendEvent(eOpenResultDialog, {
                      title: "Your trial has been extended",
                      paragraph:
                        "Try out all features of Notesnook free for 7 more days. No limitations. No commitments.",
                      button: "Continue"
                    });
                  }}
                  fontSize={AppFontSize.xs}
                  height={30}
                  style={{
                    marginBottom: 10
                  }}
                />
              )}
            </View>
          </View>
        </DialogContainer>
      </BaseDialog>
    )
  );
};
