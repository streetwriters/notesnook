import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTracked } from '../../provider';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { dWidth } from '../../utils';
import { eScrollEvent } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import { ActionIcon } from '../ActionIcon';
import { SearchInput } from '../SearchInput';
import { HeaderLeftMenu } from './HeaderLeftMenu';
import { HeaderRightMenu } from './HeaderRightMenu';
import { HeaderTitle } from './HeaderTitle';

export const Header = ({root}) => {
  const [state] = useTracked();
  const {colors} = state;
  const insets = useSafeAreaInsets();
  const [hide, setHide] = useState(true);
  const [headerTextState, setHeaderTextState] = useState(
    Navigation.getHeaderState(),
  );
  const currentScreen = headerTextState.currentScreen;

  const onHeaderStateChange = (event) => {
    if (!event) return;
     setHeaderTextState(event);
  };

  useEffect(() => {
    eSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    return () => {
      eUnSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    };
  }, []);

  const onScroll = (y) => {
    if (y > 150) {
      setHide(false);
    } else {
      setHide(true);
    }
  };

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          marginTop: Platform.OS === 'android' ? insets.top : null,
          backgroundColor: colors.bg,
          overflow: 'hidden',
          borderBottomWidth: 1,
          borderBottomColor: hide ? 'transparent' : colors.nav,
          justifyContent: 'center',
        },
      ]}>
      <View style={styles.leftBtnContainer}>
        <HeaderLeftMenu />

        {(Platform.OS === 'android' ||
        Platform.isPad) && currentScreen !== 'Search' ? (
          <HeaderTitle root={root} />
        ) : null}
      </View>
      {Platform.OS !== 'android' &&
      !Platform.isPad &&
      currentScreen !== 'Search' ? (
        <HeaderTitle root={root} />
      ) : null}

      {currentScreen === 'Search' ? (
        <View
          style={{
            width: '80%',
          }}>
          <SearchInput />
        </View>
      ) : null}

      {currentScreen === 'Search' ? (
        <View style={[styles.rightBtnContainer, {right: 6}]}>
          <ActionIcon
            onPress={() => {
              SearchService.search();
            }}
            name="magnify"
            size={SIZE.xxxl}
            color={colors.pri}
            style={styles.rightBtn}
          />
        </View>
      ) : (
        <HeaderRightMenu />
      )}
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
