import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {dWidth} from '../../utils';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {Button} from '../Button';

export const HeaderRightMenu = ({currentScreen}) => {
  const [state] = useTracked();
  const {colors, containerBottomButton, syncing} = state;
 
  return (
    <View style={styles.rightBtnContainer}>
      {syncing && <ActivityIndicator size={SIZE.xl} color={colors.accent} />}

      {currentScreen !== 'Settings' && (
        <ActionIcon
          onPress={async () => {
            Navigation.navigate('Search', {
              menu: false,
            });
          }}
          testID={notesnook.ids.default.header.buttons.left}
          name="magnify"
          size={SIZE.xxxl}
          color={colors.pri}
          customStyle={styles.rightBtn}
        />
      )}

      {DDS.isLargeTablet() && containerBottomButton.onPress ? (
        <Button
          onPress={() => {
            containerBottomButton.onPress();
          }}
          testID={notesnook.ids.default.addBtn}
          icon={currentScreen === 'Trash' ? 'delete' : 'plus'}
          iconSize={SIZE.xl}
          type="shade"
          style={{
            marginLeft: 20,
            width: 50,
            height: 35,
          }}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    zIndex: 11,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  rightBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 6,
  },
  rightBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    marginLeft: 10,
    paddingRight: 0,
  },
});
