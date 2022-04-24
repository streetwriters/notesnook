import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { FlatList, View } from 'react-native';
import { ContainerHeader } from '../../components/container/containerheader';
import { Header } from '../../components/header';
import { tabBarRef } from '../../utils/global-refs';
import { useNavigationFocus } from '../../utils/hooks/use-navigation-focus';
import { SectionItem } from './section-item';
import { RouteParams, SettingSection } from './types';

const Group = ({ navigation, route }: NativeStackScreenProps<RouteParams, 'SettingsGroup'>) => {
  useNavigationFocus(navigation, {
    onFocus: () => {
      tabBarRef.current?.lock();
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
    <View>
      <ContainerHeader>
        <Header title={route.params.name} isBack={true} screen={route.name} />
      </ContainerHeader>

      {route.params.sections ? (
        <FlatList
          data={route.params.sections}
          keyExtractor={(item, index) => item.name || index.toString()}
          renderItem={renderItem}
        />
      ) : null}
    </View>
  );
};

export default Group;
