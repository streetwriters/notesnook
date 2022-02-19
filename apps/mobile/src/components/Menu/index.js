import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notesnook } from '../../../e2e/test.ids';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import { useSettingStore, useUserStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import { eSendEvent } from '../../services/EventManager';
import SettingsService from '../../services/SettingsService';
import {
  ACCENT,
  COLOR_SCHEME,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
  COLOR_SCHEME_PITCH_BLACK,
  setColorScheme
} from '../../utils/Colors';
import { eOpenPremiumDialog } from '../../utils/Events';
import { MenuItemsList, SUBSCRIPTION_STATUS } from '../../utils/index';
import { MMKV } from '../../utils/mmkv';
import umami from '../../utils/umami';
import { ColorSection } from './ColorSection';
import { MenuListItem } from './MenuListItem';
import { TagsSection } from './TagsSection';
import { UserSection } from './UserSection';

export const Menu = React.memo(
  () => {
    const [state, dispatch] = useTracked();
    const { colors } = state;
    const deviceMode = useSettingStore(state => state.deviceMode);
    const insets = useSafeAreaInsets();
    const user = useUserStore(state => state.user);
    const noTextMode = false;

    function changeColorScheme(colors = COLOR_SCHEME, accent = ACCENT) {
      let newColors = setColorScheme(colors, accent);
      dispatch({ type: Actions.THEME, colors: newColors });
    }

    const BottomItemsList = [
      {
        name: colors.night ? 'Day' : 'Night',
        icon: 'theme-light-dark',
        func: () => {
          if (!COLOR_SCHEME.night) {
            MMKV.setStringAsync('theme', JSON.stringify({ night: true }));
            changeColorScheme(
              SettingsService.get().pitchBlack ? COLOR_SCHEME_PITCH_BLACK : COLOR_SCHEME_DARK
            );
          } else {
            MMKV.setStringAsync('theme', JSON.stringify({ night: false }));
            changeColorScheme(COLOR_SCHEME_LIGHT);
          }
        },
        switch: true,
        on: !!colors.night,
        close: false
      },
      {
        name: 'Settings',
        icon: 'cog-outline',
        close: true
      }
    ];

    const pro = {
      name: 'Notesnook Pro',
      icon: 'crown',
      func: () => {
        umami.pageView('/pro-screen', '/sidemenu');
        eSendEvent(eOpenPremiumDialog);
      }
    };

    const renderItem = useCallback(
      () => (
        <>
          {MenuItemsList.map((item, index) => (
            <MenuListItem key={item.name} item={item} testID={item.name} index={index} />
          ))}
          <ColorSection noTextMode={noTextMode} />
          <TagsSection />
        </>
      ),
      []
    );

    return (
      <View
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: colors.nav
        }}
      >
        <View
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: deviceMode !== 'mobile' ? colors.nav : colors.bg,
            paddingTop: insets.top,
            borderRadius: 10
          }}
        >
          <FlatList
            alwaysBounceVertical={false}
            contentContainerStyle={{
              flexGrow: 1
            }}
            style={{
              height: '100%',
              width: '100%',
              paddingHorizontal: 12
            }}
            showsVerticalScrollIndicator={false}
            data={[0]}
            keyExtractor={() => 'mainMenuView'}
            renderItem={renderItem}
          />
          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            {!user ||
            user?.subscription?.type === SUBSCRIPTION_STATUS.TRIAL ||
            user?.subscription?.type === SUBSCRIPTION_STATUS.BASIC ? (
              <MenuListItem testID={pro.name} key={pro.name} item={pro} index={0} ignore={true} />
            ) : null}

            {BottomItemsList.slice(DDS.isLargeTablet() ? 0 : 1, 3).map((item, index) => (
              <MenuListItem
                testID={item.name == 'Night mode' ? notesnook.ids.menu.nightmode : item.name}
                key={item.name}
                item={item}
                index={index}
                ignore={true}
                rightBtn={
                  DDS.isLargeTablet() || item.name === 'Notesnook Pro' ? null : BottomItemsList[0]
                }
              />
            ))}
          </View>

          <View
            style={{
              width: '100%',
              paddingHorizontal: 0
            }}
          >
            <UserSection noTextMode={noTextMode} />
          </View>
        </View>
      </View>
    );
  },
  () => true
);
