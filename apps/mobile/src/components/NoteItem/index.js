import React, {useState, createRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  Platform,
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

import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../Reminder';
import {getElevation, timeSince} from '../../utils/utils';
import NavigationService from '../../services/NavigationService';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;
let setMenuRef = {};
const NoteItem = props => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const item = props.item;

  return (
    <View
      style={{
        marginHorizontal: w * 0.05,

        marginVertical: h * 0.015,
        borderRadius: br,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        padding: pv,
        width: Platform.isPad ? '95%' : '90%',
        alignSelf: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
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
                fontSize: SIZE.xs + 2,
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
                fontSize: SIZE.xxs + 2,
                textAlignVertical: 'center',
                fontFamily: WEIGHT.regular,
              }}>
              {timeSince(item.dateCreated) + '  '}
            </Text>
          </View>
        </>
      </TouchableOpacity>

      <View
        style={{
          width: w * 0.05,
          justifyContent: 'center',
          minHeight: 70,
          alignItems: 'center',
        }}>
        <Menu
          style={{
            borderRadius: 5,
          }}
          ref={ref => (setMenuRef[props.index] = ref)}
          button={
            <TouchableOpacity
              style={{
                width: w * 0.05,
                justifyContent: 'center',
                minHeight: 70,
                alignItems: 'center',
              }}
              onPress={() => setMenuRef[props.index].show()}>
              <Icon name="more-vertical" size={SIZE.lg} color={colors.icon} />
            </TouchableOpacity>
          }>
          <MenuItem
            textStyle={{
              color: colors.pri,
              backgroundColor: colors.bg,
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
            }}>
            <Icon name="star" size={SIZE.sm} color={colors.icon} />
            {'  '}Favourite
          </MenuItem>
          <MenuItem
            textStyle={{
              color: colors.pri,
              backgroundColor: colors.bg,
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
            }}>
            <Icon name="share" size={SIZE.sm} color={colors.icon} />
            {'  '}Share
          </MenuItem>

          <MenuItem
            textStyle={{
              color: colors.pri,
              backgroundColor: colors.bg,
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
            }}>
            <Icon name="trash" size={SIZE.sm} color={colors.icon} />
            {'  '}Delete
          </MenuItem>
        </Menu>
      </View>
    </View>
  );
};

export default NoteItem;
