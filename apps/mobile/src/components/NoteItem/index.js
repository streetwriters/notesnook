import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
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
import {getElevation, timeSince} from '../../utils/utils';
import NavigationService from '../../services/NavigationService';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

const NoteItem = props => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const item = props.item;

  return (
    <View
      style={{
        marginHorizontal: w * 0.05,
        backgroundColor: '#f0f0f0',
        marginVertical: h * 0.015,
        borderRadius: br,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        padding: pv,
      }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          NavigationService.navigate('Editor', {
            note: item,
          });
        }}
        style={{
          width: '95%',
        }}>
        <>
          <Text
            numberOfLines={1}
            style={{
              color: colors.pri,
              fontSize: SIZE.md,
              fontFamily: WEIGHT.bold,
              maxWidth: '100%',
              marginBottom: 5,
            }}>
            {item.title.replace('\n', '')}
          </Text>
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
                paddingRight: ph,
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
              {timeSince(item.dateCreated) + '  '}
            </Text>
          </View>
        </>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          width: '5%',
          justifyContent: 'center',
          minHeight: 70,
          alignItems: 'center',
        }}>
        <Icon name="md-more" size={SIZE.lg} color={colors.icon} />
      </TouchableOpacity>
    </View>
  );
};

export default NoteItem;
