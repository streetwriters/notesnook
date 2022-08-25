import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../screens/search/search-bar';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import useNavigationStore from '../../stores/use-navigation-store';
import { useSelectionStore } from '../../stores/use-selection-store';
import { useThemeStore } from '../../stores/use-theme-store';
import { eScrollEvent } from '../../utils/events';
import { LeftMenus } from './left-menus';
import { RightMenus } from './right-menus';
import { Title } from './title';

export const Header = React.memo(
  () => {
    const colors = useThemeStore(state => state.colors);
    const insets = useSafeAreaInsets();
    const [hide, setHide] = useState(true);
    const selectionMode = useSelectionStore(state => state.selectionMode);
    const currentScreen = useNavigationStore(state => state.currentScreen?.name);

    const onScroll = data => {
      if (data.y > 150) {
        if (!hide) return;
        setHide(false);
      } else {
        if (hide) return;
        setHide(true);
      }
    };

    useEffect(() => {
      eSubscribeEvent(eScrollEvent, onScroll);
      return () => {
        eUnSubscribeEvent(eScrollEvent, onScroll);
      };
    }, [hide]);

    return selectionMode ? null : (
      <>
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
          ]}
        >
          {currentScreen === 'Search' ? (
            <SearchBar />
          ) : (
            <>
              <View style={styles.leftBtnContainer}>
                <LeftMenus />
                <Title />
              </View>
              <RightMenus />
            </>
          )}
        </View>
      </>
    );
  },
  () => true
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    zIndex: 11,
    height: 50,
    maxHeight: 50,
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
