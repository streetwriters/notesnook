import React from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import NavigationService from '../../services/Navigation';
import {dWidth} from '../../utils';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {Button} from '../Button';

export const HeaderRightMenu = () => {
  const [state] = useTracked();
  const {colors, containerBottomButton, currentScreen, syncing} = state;

  return (
    <View style={styles.rightBtnContainer}>
      {syncing && <ActivityIndicator size={SIZE.xl} color={colors.accent} />}

      <ActionIcon
        onPress={async () => {
          NavigationService.navigate('Search');
        }}
        name="magnify"
        size={SIZE.xxxl}
        color={colors.pri}
        customStyle={styles.rightBtn}
      />

      {DDS.isLargeTablet() && containerBottomButton.onPress ? (
        <Button
          onPress={() => {
            containerBottomButton.onPress();
          }}
          icon={currentScreen === 'trash' ? 'delete' : 'plus'}
          iconSize={SIZE.xl}
          type="shade"
          style={{
            marginLeft: 20,
            width: 60,
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
  loadingContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    left: dWidth / 2 - 20,
    top: -20,
    width: 40,
    height: 40,
    position: 'absolute',
  },
  loadingInnerContainer: {
    width: 40,
    height: 20,
    position: 'absolute',
    zIndex: 10,
    top: 0,
  },
  leftBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'absolute',
    left: 12,
  },
  leftBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    borderRadius: 100,
    marginLeft: -5,
    marginRight: 25,
  },
  rightBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 12,
  },
  rightBtn: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 40,
    width: 50,
    paddingRight: 0,
  },
});
