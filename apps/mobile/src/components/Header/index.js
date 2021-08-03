import React, {useEffect, useState} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import SearchService from '../../services/SearchService';
import {eScrollEvent} from '../../utils/Events';
import {ActionIcon} from '../ActionIcon';
import {SearchInput} from '../SearchInput';
import {HeaderLeftMenu} from './HeaderLeftMenu';
import {HeaderRightMenu} from './HeaderRightMenu';
import {Title} from './title';

export const Header = React.memo(
  ({root, title, screen, isBack, color, action, rightButtons}) => {
    const [state] = useTracked();
    const {colors} = state;
    const insets = useSafeAreaInsets();
    const [hide, setHide] = useState(true);

    const onScroll = data => {
      if (data.screen !== screen) return;
      if (data.y > 150) {
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
            justifyContent: 'space-between'
          }
        ]}>
        <View style={styles.leftBtnContainer}>
          <HeaderLeftMenu headerMenuState={!isBack} currentScreen={screen} />

          {screen !== 'Search' ? (
            <Title
              headerColor={color}
              heading={title}
              screen={screen}
              root={root}
            />
          ) : null}
        </View>

        {screen === 'Search' ? (
          <>
            <View
              style={{
                width: '80%'
              }}>
              <SearchInput />
            </View>
            <View style={[styles.rightBtnContainer]}>
              <ActionIcon
                onPress={() => {
                  SearchService.search();
                }}
                name="magnify"
                color={colors.pri}
                style={styles.rightBtn}
              />
            </View>
          </>
        ) : (
          <HeaderRightMenu
            rightButtons={rightButtons}
            action={action}
            currentScreen={screen}
          />
        )}
      </View>
    );
  },
  (prev, next) => prev.title === next.title
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    zIndex: 11,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    width: '100%'
  },
  leftBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexShrink: 1
  },
  leftBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    borderRadius: 100,
    marginLeft: -5,
    marginRight: 25
  },
  rightBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rightBtn: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 40,
    width: 40,
    paddingRight: 0
  }
});
