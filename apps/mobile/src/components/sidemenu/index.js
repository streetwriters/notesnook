import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notesnook } from '../../../e2e/test.ids';
import Settings from '../../screens/settings';
import { DDS } from '../../services/device-detection';
import { eSendEvent } from '../../services/event-manager';
import { useUserStore } from '../../stores/use-user-store';
import { useSettingStore } from '../../stores/use-setting-store';
import { useNoteStore } from '../../stores/use-notes-store';
import { useThemeStore } from '../../stores/use-theme-store';
import umami from '../../utils/analytics';
import { toggleDarkMode } from '../../utils/color-scheme/utils';
import { MenuItemsList, SUBSCRIPTION_STATUS } from '../../utils/constants';
import { eOpenPremiumDialog } from '../../utils/events';
import { ColorSection } from './color-section';
import { MenuItem } from './menu-item';
import { TagsSection } from './pinned-section';
import { UserStatus } from './user-status';
import Navigation from '../../services/navigation';

export const SideMenu = React.memo(
  () => {
    const colors = useThemeStore(state => state.colors);
    const deviceMode = useSettingStore(state => state.deviceMode);
    const insets = useSafeAreaInsets();
    const subscriptionType = useUserStore(state => state.user?.subscription?.type);
    const loading = useNoteStore(state => state.loading);
    const introCompleted = useSettingStore(state => state.settings.introCompleted);
    const noTextMode = false;

    const BottomItemsList = [
      {
        name: colors.night ? 'Day' : 'Night',
        icon: 'theme-light-dark',
        func: toggleDarkMode,
        switch: true,
        on: !!colors.night,
        close: false
      },
      {
        name: 'Settings',
        icon: 'cog-outline',
        close: true,
        func: () => {
          Navigation.navigate({
            name: 'Settings',
            title: 'Settings'
          });
        }
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
            <MenuItem key={item.name} item={item} testID={item.name} index={index} />
          ))}
          <ColorSection noTextMode={noTextMode} />
          <TagsSection />
        </>
      ),
      []
    );

    return !loading && introCompleted ? (
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
            {subscriptionType === SUBSCRIPTION_STATUS.TRIAL ||
            subscriptionType === SUBSCRIPTION_STATUS.BASIC ? (
              <MenuItem testID={pro.name} key={pro.name} item={pro} index={0} ignore={true} />
            ) : null}

            {BottomItemsList.slice(DDS.isLargeTablet() ? 0 : 1, 3).map((item, index) => (
              <MenuItem
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
            <UserStatus noTextMode={noTextMode} />
          </View>
        </View>
      </View>
    ) : null;
  },
  () => true
);
