import React from 'react';
import { ScrollView, View } from 'react-native';
import { useThemeStore } from '../../stores/theme';
import { SIZE } from '../../utils/size';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
import { FeatureBlock } from './feature';
import { ProTag } from './pro-tag';

export const Group = ({ item, index }) => {
  const colors = useThemeStore(state => state.colors);

  return (
    <View
      style={{
        paddingHorizontal: 12,
        backgroundColor: index % 2 !== 0 ? colors.bg : colors.nav,
        paddingVertical: 40
      }}
    >
      {item?.pro ? (
        <ProTag size={SIZE.sm} background={index % 2 === 0 ? colors.bg : colors.nav} />
      ) : null}
      <Heading>{item.title}</Heading>
      <Paragraph size={SIZE.md}>{item.detail}</Paragraph>

      {item.features && (
        <ScrollView
          style={{
            marginTop: 20
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {item.features?.map(item => (
            <FeatureBlock
              key={item.detail}
              {...item}
              detail={item.detail}
              pro={item.pro}
              proTagBg={index % 2 === 0 ? colors.bg : colors.nav}
            />
          ))}
        </ScrollView>
      )}
      {item.info ? (
        <Paragraph
          style={{
            marginTop: 10
          }}
          size={SIZE.xs}
          color={colors.icon}
        >
          {item.info}
        </Paragraph>
      ) : null}
    </View>
  );
};
