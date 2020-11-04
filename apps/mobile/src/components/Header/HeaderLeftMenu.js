import React, {useEffect} from 'react';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import {DDS} from '../../services/DeviceDetection';
import {ActionIcon} from '../ActionIcon';
import NavigationService from '../../services/Navigation';
import {eSendEvent} from '../../services/EventManager';
import {eClearSearch} from '../../utils/Events';
import {BackHandler} from 'react-native';

export const HeaderLeftMenu = () => {
  const [state] = useTracked();
  const {colors, headerMenuState, searchResults} = state;

  const onLeftButtonPress = () => {
    if (searchResults.results.length > 0) {
      eSendEvent(eClearSearch);
      return;
    }
    if (headerMenuState) {
      NavigationService.openDrawer();
      return;
    }
    NavigationService.goBack();
  };

  const onBackPress = () => {
    if (searchResults.results.length > 0) {
      eSendEvent(eClearSearch);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (searchResults.results.length > 0) {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
    } else {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [searchResults.results]);

  return (
    <>
      {!DDS.isTab ? (
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
          name={
            !headerMenuState || searchResults.results.length > 0
              ? 'arrow-left'
              : 'menu'
          }
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
