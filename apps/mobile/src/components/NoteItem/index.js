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
import {getElevation, timeSince, ToastEvent} from '../../utils/utils';
import NavigationService from '../../services/NavigationService';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
import {Dialog} from '../Dialog';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

const NoteItem = props => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [visible, setVisible] = useState(false);
  const item = props.item;
  let setMenuRef = {};
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
      <Dialog
        visible={visible}
        title="Delete note"
        icon="trash"
        paragraph="Do you want to delete this note?"
        positiveText="Delete"
        close={() => {
          setVisible(false);
        }}
      />
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
              numberOfLines={2}
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

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}>
              <Icon
                style={{width: 30}}
                name="lock"
                size={SIZE.sm}
                color={colors.icon}
              />
              <Icon
                style={{width: 30}}
                name="star"
                size={SIZE.sm}
                color={colors.icon}
              />

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

              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
            }}>
            <Icon name="star" size={SIZE.sm} color={colors.icon} />
            {'  '}Pin
          </MenuItem>
          <MenuItem
            onPress={() => {
              setMenuRef[props.index].hide();
              ToastEvent.show(
                'Note added to favorites.',
                'success',
                3000,
                () => {},
                'Ok',
              );
            }}
            textStyle={{
              color: colors.pri,

              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
            }}>
            <Icon name="star" size={SIZE.sm} color={colors.icon} />
            {'  '}Favorite
          </MenuItem>

          <MenuItem
            textStyle={{
              color: colors.pri,
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
            }}>
            <Icon name="share" size={SIZE.sm} color={colors.icon} />
            {'  '}Share
          </MenuItem>

          <MenuItem
            onPress={() => {
              setMenuRef[props.index].hide();
              NavigationService.navigate('Folders', {
                note: item,
                title: 'Choose Notebook',
                isMove: true,
                hideMore: true,
              });
            }}
            textStyle={{
              color: colors.pri,

              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
            }}>
            <Icon name="arrow-right" size={SIZE.sm} color={colors.icon} />
            {'  '}Move
          </MenuItem>

          <MenuItem
            onPress={() => {
              setVisible(true);
              setMenuRef[props.index].hide();
            }}
            textStyle={{
              color: colors.pri,

              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
            }}>
            <Icon name="trash" size={SIZE.sm} color={colors.icon} />
            {'  '}Delete
          </MenuItem>
          <MenuDivider />
          <MenuItem
            disabled={true}
            textStyle={{
              color: colors.icon,

              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs,
            }}
            style={{
              paddingVertical: 0,
              margin: 0,
              height: 30,
            }}>
            Notebook: School Notes
          </MenuItem>
          <MenuItem
            disabled={true}
            textStyle={{
              color: colors.icon,

              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs,
            }}
            style={{
              paddingVertical: 0,
              margin: 0,
              height: 30,
              paddingBottom: 10,
            }}>
            {'  '}- Topic: Physics
          </MenuItem>

          <MenuItem
            disabled={true}
            textStyle={{
              color: colors.icon,

              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs,
            }}
            style={{
              paddingVertical: 0,
              margin: 0,
              height: 30,
              paddingBottom: 10,
            }}>
            Created on: {new Date(item.dateCreated).toISOString().slice(0, 10)}
          </MenuItem>
        </Menu>
      </View>
    </View>
  );
};

export default NoteItem;
