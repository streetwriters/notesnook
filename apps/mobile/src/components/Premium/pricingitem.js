import React from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const PricingItem = ({product, onPress}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  return (
    <PressableButton
      onPress={onPress}
      customStyle={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 10
      }}>
      <View>
        <Heading size={SIZE.lg - 2}>
          {product.type === 'yearly' || product.offerType === 'yearly'
            ? 'Yearly'
            : 'Monthly'}
        </Heading>
        {product.info && (
          <Paragraph size={SIZE.xs + 1}>{product.info}</Paragraph>
        )}
      </View>

      <View>
        <Paragraph size={SIZE.sm}>
          <Heading size={SIZE.lg - 2}>{product?.data?.localizedPrice}/</Heading>
          {product.type === 'yearly' || product.offerType === 'yearly'
            ? '/year'
            : '/month'}
        </Paragraph>
      </View>
    </PressableButton>
  );
};
