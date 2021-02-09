import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { hexToRGBA } from '../../utils/ColorUtils';
import { SIZE } from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';

export const Filler = ({item, background}) => {
  const [state] = useTracked();
  const {colors, currentEditingNote} = state;
  const color = item.color || 'accent';

  return (
    <View
      style={{
        position: 'absolute',
        width: '110%',
        height: '110%',
        paddingVertical: '3.5%',
        paddingHorizontal: '5%',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}>
      <View
        style={{
          flexDirection: 'row',
        }}>
        {item.conflicted ? (
          <View
            style={{
              backgroundColor: hexToRGBA(colors.red, 0.12),
              paddingHorizontal: 3,
              paddingVertical: 2,
              borderRadius: 3,
              marginRight: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Icon name="alert-circle" size={SIZE.xxs} color={colors.red} />
            <Heading
              size={SIZE.xxs}
              style={{
                color: colors.red,
                marginLeft: 5,
              }}>
              CONFLICTS
            </Heading>
          </View>
        ) : null}

        {currentEditingNote === item.id ? (
          <View
            style={{
              backgroundColor: hexToRGBA(colors[color], 0.12),
              paddingHorizontal: 3,
              paddingVertical: 2,
              borderRadius: 3,
              marginRight: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Icon name="pencil-outline" size={SIZE.xxs} color={colors[color]} />
            <Heading
              size={SIZE.xxs}
              style={{marginLeft: 5}}
              color={colors[color]}>
              EDITING NOW
            </Heading>
          </View>
        ) : null}
      </View>
    </View>
  );
};
