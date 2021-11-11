import React from 'react';
import {ScrollView, View} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {FeatureBlock} from './feature';
import {ProTag} from './pro-tag';

export const Group = ({item, index}) => {
  const [state] = useTracked();
  const colors = state.colors;

  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingVertical: 8,
        backgroundColor: index % 2 !== 0 ? colors.bg : colors.nav,
        paddingVertical: 40
      }}>
      {item?.pro && (
        <ProTag
          size={SIZE.sm}
          background={index % 2 === 0 ? colors.bg : colors.nav}
        />
      )}
      <Heading>{item.title}</Heading>
      <Paragraph size={SIZE.md}>{item.detail}</Paragraph>

      {item.features && (
        <ScrollView
          style={{
            marginTop: 20
          }}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {item.features?.map(item => (
            <FeatureBlock
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
          size={SIZE.xs + 1}
          color={colors.icon}>
          {item.info}
        </Paragraph>
      ) : null}
    </View>
  );
};
