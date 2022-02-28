import React from 'react';
import { notesnook } from '../../../e2e/test.ids';
import { useTracked } from '../../provider';
import { useSettingStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import Navigation from '../../services/Navigation';
import { IconButton } from '../ui/icon-button';

export const LeftMenus = ({ currentScreen, headerMenuState }) => {
  const [state] = useTracked();
  const { colors } = state;
  const deviceMode = useSettingStore(state => state.deviceMode);

  const onLeftButtonPress = () => {
    if (headerMenuState) {
      Navigation.openDrawer();
      return;
    }
    Navigation.goBack();
  };

  return (
    <>
      {deviceMode !== 'tablet' || currentScreen === 'Search' || !headerMenuState ? (
        <IconButton
          testID={notesnook.ids.default.header.buttons.left}
          customStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            height: 40,
            width: 40,
            borderRadius: 100,
            marginLeft: -5,
            marginRight: DDS.isLargeTablet() ? 10 : 25
          }}
          left={40}
          top={40}
          right={DDS.isLargeTablet() ? 10 : 25}
          onPress={onLeftButtonPress}
          onLongPress={() => {
            Navigation.popToTop();
          }}
          name={!headerMenuState ? 'arrow-left' : 'menu'}
          color={colors.pri}
          iconStyle={{
            marginLeft: !headerMenuState ? -5 : 0
          }}
        />
      ) : undefined}
    </>
  );
};
