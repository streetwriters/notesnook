import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { useThemeStore } from '../../stores/theme';
import { eScrollEvent } from '../../utils/events';
import { LeftMenus } from './left-menus';
import { RightMenus } from './right-menus';
import { Title } from './title';

export const Header = React.memo(
  ({ root, title, screen, isBack, color, action, rightButtons, notebook, onBackPress }) => {
    const colors = useThemeStore(state => state.colors);
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
        ]}
      >
        <View style={styles.leftBtnContainer}>
          <LeftMenus onBackPress={onBackPress} headerMenuState={!isBack} currentScreen={screen} />

          <Title
            notebook={notebook}
            headerColor={color}
            heading={title}
            screen={screen}
            root={root}
          />
        </View>

        <RightMenus rightButtons={rightButtons} action={action} currentScreen={screen} />
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
