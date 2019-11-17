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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: pv,
      }}>
      <View
        style={{
          width: '92%',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <Text
          style={{
            fontSize: SIZE.md,
            fontFamily: WEIGHT.bold,
          }}>
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: SIZE.xs + 1,
            color: colors.icon,
            fontFamily: WEIGHT.regular,
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
      <TouchableOpacity
        style={{
          width: '8%',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 60,
        }}>
        <Icon name="md-more" size={SIZE.xl} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );
};

export default NoteItem;
