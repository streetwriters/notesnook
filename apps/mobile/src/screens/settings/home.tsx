import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Bar } from 'react-native-progress';
import { ContainerHeader } from '../../components/container/containerheader';
import BaseDialog from '../../components/dialog/base-dialog';
import { Header } from '../../components/header';
import Heading from '../../components/ui/typography/heading';
import Paragraph from '../../components/ui/typography/paragraph';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import useNavigationStore from '../../stores/use-navigation-store';
import { useThemeStore } from '../../stores/use-theme-store';
import { useNavigationFocus } from '../../utils/hooks/use-navigation-focus';
import { SIZE } from '../../utils/size';
import { SectionGroup } from './section-group';
import { settingsGroups } from './settings-data';
import { RouteParams, SettingSection } from './types';
import SettingsUserSection from './user-section';

const Home = ({ navigation, route }: NativeStackScreenProps<RouteParams, 'SettingsHome'>) => {
  const colors = useThemeStore(state => state.colors);
  const [loading, setLoading] = useState(false);
  const flatlistRef = useRef<FlatList<SettingSection>>(null);
  const isFocused = useNavigationFocus(navigation, {
    onFocus: () => {
      useNavigationStore.getState().update({
        name: 'Settings'
      });
      return true;
    },
    onBlur: () => {
      flatlistRef.current?.scrollToOffset({
        offset: 0,
        animated: false
      });
      return navigation.getState().index === 0;
    }
  });

  const renderItem = ({ item, index }: { item: SettingSection; index: number }) =>
    item.name === 'account' ? <SettingsUserSection item={item} /> : <SectionGroup item={item} />;

  useEffect(() => {
    eSubscribeEvent('settings-loading', setLoading);
    return () => {
      eUnSubscribeEvent('settings-loading', setLoading);
    };
  }, []);

  return (
    <View>
      {loading && (
        <BaseDialog animated={false} bounce={false} visible={true}>
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: colors.bg,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Heading color={colors.pri} size={SIZE.lg}>
              Logging out
            </Heading>
            <Paragraph color={colors.icon}>
              Please wait while we log out and clear app data.
            </Paragraph>
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                marginTop: 15
              }}
            >
              <Bar
                height={5}
                width={100}
                animated={true}
                useNativeDriver
                indeterminate
                indeterminateAnimationDuration={2000}
                unfilledColor={colors.nav}
                color={colors.accent}
                borderWidth={0}
              />
            </View>
          </View>
        </BaseDialog>
      )}

      <FlatList
        data={isFocused ? settingsGroups : settingsGroups.slice(0, 3)}
        ref={flatlistRef}
        keyExtractor={(item, index) =>
          typeof item.name === 'function'
            ? item.name({}) || index.toString()
            : item.name || index.toString()
        }
        ListFooterComponent={<View style={{ height: 200 }} />}
        renderItem={renderItem}
      />
    </View>
  );
};

export default Home;
