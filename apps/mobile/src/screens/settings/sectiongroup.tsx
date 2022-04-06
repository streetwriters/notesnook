import React from 'react';
import { View } from 'react-native';
import Heading from '../../components/ui/typography/heading';
import { useThemeStore } from '../../stores/theme';
import { SIZE } from '../../utils/size';
import { SectionItem } from './section-item';
import { SettingSection } from './types';

export const SectionGroup = ({ item }: { item: SettingSection }) => {
  const colors = useThemeStore(state => state.colors);
  return (
    <View
      style={{
        marginVertical: item.sections ? 10 : 0
      }}
    >
      {item.name && item.sections ? (
        <Heading
          style={{
            paddingHorizontal: 12
          }}
          color={colors.icon}
          size={SIZE.sm}
        >
          {item.name}
        </Heading>
      ) : null}

      {item.sections?.map(item => (
        <SectionItem key={item.name} item={item} />
      ))}
    </View>
  );
};
