import React from 'react';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import Navigation from '../../services/Navigation';
import SettingsService from '../../services/SettingsService';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';

export const HeaderLeftMenu = () => {
  const [state] = useTracked();
  const {colors, headerMenuState, currentScreen, deviceMode} = state;

  const onLeftButtonPress = () => {
    if (headerMenuState) {
      Navigation.openDrawer();
      return;
    }
    Navigation.goBack();
  };
  return (
    <>
      {deviceMode === 'mobile' ||
      currentScreen === 'search' ||
      !headerMenuState ? (
        <ActionIcon
          testID={notesnook.ids.default.header.buttons.left}
          customStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            height: 40,
            width: 40,
            borderRadius: 100,
            marginLeft: -5,
            marginRight:DDS.isLargeTablet()? 10 : 25,
          }}
          onPress={onLeftButtonPress}
          onLongPress={() => {
            Navigation.popToTop();
          }}
          name={!headerMenuState ? 'arrow-left' : 'menu'}
          size={SIZE.xxxl}
          color={colors.pri}
          iconStyle={{
            marginLeft: !headerMenuState ? -5 : 0,
          }}
        />
      ) : undefined}
    </>
  );
};
