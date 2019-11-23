import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';

import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
} from '../../common/common';

import Icon from 'react-native-vector-icons/Ionicons';
import {Reminder} from '../Reminder';
import {getElevation} from '../../utils/utils';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

const NoteItem = props => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const item = props.item;

  return (
    <View
      activeOpacity={opacity}
      style={{
        marginHorizontal: w * 0.05,
        backgroundColor: '#f0f0f0',
        marginVertical: h * 0.015,
        borderRadius: br,

        justifyContent: 'center',
        alignItems: 'center',
        padding: pv,
      }}>
      <View
        style={{
          width: '100%',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text
          numberOfLines={1}
          style={{
            color: colors.pri,
            fontSize: SIZE.md,
            fontFamily: WEIGHT.bold,
            maxWidth: '100%',
          }}>
          {item.title}
        </Text>

        <View
          style={{
            width: '20%',
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Icon name="md-share-alt" size={SIZE.lg} color={colors.icon} />
          <Icon name="md-star" size={SIZE.lg} color={colors.icon} />
          <Icon name="md-more" size={SIZE.lg} color={colors.icon} />
        </View>
      </View>
      <View
        style={{
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          width: '100%',
        }}>
        <Text
          style={{
            fontSize: SIZE.xs + 1,
            color: colors.icon,
            fontFamily: WEIGHT.regular,
            width: '100%',
            maxWidth: '100%',
          }}>
          {item.headline}
        </Text>

        <Text
          style={{
            color: colors.accent,
            fontSize: SIZE.xxs,
            textAlignVertical: 'center',
            fontFamily: WEIGHT.regular,
          }}>
          {item.timestamp + '  '}
        </Text>
      </View>
    </View>
  );
};

export default NoteItem;
