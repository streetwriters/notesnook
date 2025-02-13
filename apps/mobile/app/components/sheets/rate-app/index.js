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

import React, { useEffect, useRef, useState } from "react";
import { Linking, View } from "react-native";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { clearMessage } from "../../../services/message";
import SettingsService from "../../../services/settings";
import { STORE_LINK } from "../../../utils/constants";
import { eCloseRateDialog, eOpenRateDialog } from "../../../utils/events";
import { AppFontSize } from "../../../utils/size";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import SheetWrapper from "../../ui/sheet";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";
const RateAppSheet = () => {
  const [visible, setVisible] = useState(false);
  const actionSheetRef = useRef();

  useEffect(() => {
    eSubscribeEvent(eOpenRateDialog, open);
    eSubscribeEvent(eCloseRateDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenRateDialog, open);
      eUnSubscribeEvent(eCloseRateDialog, close);
    };
  }, []);

  const open = () => {
    setVisible(true);
  };
  useEffect(() => {
    if (visible) {
      actionSheetRef.current?.show();
    }
  }, [visible]);

  const close = () => {
    actionSheetRef.current?.hide();
  };

  const onClose = async () => {
    SettingsService.set({
      rateApp: Date.now() + 86400000 * 7
    });
    setVisible(false);
    clearMessage();
  };

  const rateApp = async () => {
    await Linking.openURL(STORE_LINK);
    SettingsService.set({
      rateApp: false
    });
    setVisible(false);
    clearMessage();
  };

  return !visible ? null : (
    <SheetWrapper centered={false} fwdRef={actionSheetRef} onClose={onClose}>
      <View
        style={{
          width: "100%",
          alignSelf: "center",
          paddingHorizontal: 12
        }}
      >
        <Heading>{strings.rateAppHeading()}</Heading>
        <Paragraph size={AppFontSize.md}>{strings.rateAppDesc()}</Paragraph>

        <Seperator half />
        <Button
          onPress={rateApp}
          fontSize={AppFontSize.md}
          width="100%"
          type="accent"
          title={strings.rateApp()}
        />
        <View
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            flexDirection: "row",
            paddingTop: 12,
            width: "100%",
            alignSelf: "center"
          }}
        >
          <Button
            onPress={async () => {
              SettingsService.set({
                rateApp: false
              });
              setVisible(false);
              clearMessage();
            }}
            fontSize={AppFontSize.md}
            type="error"
            width="48%"
            title={strings.never()}
          />
          <Button
            onPress={onClose}
            fontSize={AppFontSize.md}
            width="48%"
            type="secondary"
            title={strings.later()}
          />
        </View>
      </View>
    </SheetWrapper>
  );
};

export default RateAppSheet;
