import React from 'react';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import NavigationService from '../../services/Navigation';
import { SIZE } from '../../utils/SizeUtils';
import { ActionIcon } from '../ActionIcon';

export const HeaderLeftMenu = () => {
  const [state] = useTracked();
  const {colors, headerMenuState, currentScreen} = state;

  const onLeftButtonPress = () => {
    if (headerMenuState) {
      NavigationService.openDrawer();
      return;
    }
    NavigationService.goBack();
  };

  return (
    <>
      {!DDS.isTab || currentScreen === 'search' ? (
        <ActionIcon
          testID="left_menu_button"
          customStyle={{
            justifyContent: 'center',
            alignItems: 'center',
            height: 40,
            width: 40,
            borderRadius: 100,
            marginLeft: -5,
            marginRight: 25,
          }}
          onPress={onLeftButtonPress}
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
