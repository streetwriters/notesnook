import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, Layout, ZoomIn } from 'react-native-reanimated';
import { Empty } from '../../components/list/empty';
import useNavigationStore from '../../stores/use-navigation-store';
import { useThemeStore } from '../../stores/use-theme-store';
import { tabBarRef } from '../../utils/global-refs';
import { useNavigationFocus } from '../../utils/hooks/use-navigation-focus';
import { SectionItem } from './section-item';
import { RouteParams, SettingSection } from './types';

const useDelayLayout = (delay: number) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeout = setTimeout(() => {
      setLoading(false);
    }, delay);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return loading;
};

const Loading = () => {
  const colors = useThemeStore(state => state.colors.accent);

  return (
    <Empty
      placeholderData={{
        paragraph: 'Personalize Notesnook the way you wish to.',
        heading: 'Minimal & meaningful',
        loading: 'Personalize Notesnook the way you wish to.'
      }}
      headerProps={{
        color: 'accent'
      }}
    />
  );
};

const Group = ({ navigation, route }: NativeStackScreenProps<RouteParams, 'SettingsGroup'>) => {
  const loading = useDelayLayout(300);
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

  return loading ? (
    <Loading />
  ) : (
    <View>
      {route.params.sections ? (
        <Animated.View entering={FadeInDown}>
          <FlatList
            data={route.params.sections}
            keyExtractor={(item, index) => item.name || index.toString()}
            renderItem={renderItem}
          />
        </Animated.View>
      ) : null}
    </View>
  );
};

export default Group;
