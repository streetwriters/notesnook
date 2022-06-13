import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { FlatList, View } from 'react-native';
import DelayLayout from '../../components/delay-layout';
import useNavigationStore from '../../stores/use-navigation-store';
import { tabBarRef } from '../../utils/global-refs';
import { useNavigationFocus } from '../../utils/hooks/use-navigation-focus';
import { SectionItem } from './section-item';
import { RouteParams, SettingSection } from './types';

const keyExtractor = (item: SettingSection, index: number) => item.id;

const Group = ({ navigation, route }: NativeStackScreenProps<RouteParams, 'SettingsGroup'>) => {
  useNavigationFocus(navigation, {
    onFocus: () => {
      tabBarRef.current?.lock();
      console.log('called');
      useNavigationStore.getState().update(
        {
          name: 'SettingsGroup',
          //@ts-ignore
          title: route.params.name
        },
        true
      );
      return false;
    }
  });
  useEffect(() => {
    return () => {
      tabBarRef.current?.unlock();
    };
  }, []);
  const renderItem = ({ item, index }: { item: SettingSection; index: number }) => (
    <SectionItem item={item} />
  );

  return (
    <DelayLayout>
      <View>
        {route.params.sections ? (
          <FlatList
            data={route.params.sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        ) : null}
      </View>
    </DelayLayout>
  );
};

export default Group;
