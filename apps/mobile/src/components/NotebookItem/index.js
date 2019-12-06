import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import NavigationService from '../../services/NavigationService';
import Menu, {MenuItem, MenuDivider} from 'react-native-material-menu';
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
import {w} from '../../utils/utils';
export const NotebookItem = ({
  item,
  index,
  colors,
  hideMore,
  topic,
  isTopic = false,
}) => {
  let setMenuRef = {};
  return (
    <TouchableOpacity
      activeOpacity={opacity}
      onPress={() => {
        NavigationService.navigate('Notebook', {
          notebook: item,
          title: hideMore ? 'Choose topic' : item.title,
          isMove: hideMore ? true : false,
          hideMore: hideMore ? true : false,
        });
      }}
      style={{
        paddingHorizontal: ph,
        marginHorizontal: '5%',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: pv + 5,
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <View>
          <Text
            style={{
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.md,
              color: colors.pri,
              maxWidth: '100%',
            }}>
            {item.title}
          </Text>
          {isTopic ? null : (
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.xs + 1,
                color: colors.pri,
                maxWidth: '100%',
              }}>
              {item.description}
            </Text>
          )}

          {isTopic ? null : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 5,
              }}>
              {Object.keys(item.topics)
                .slice(0, 3)
                .map(topic => (
                  <Text
                    style={{
                      borderRadius: 5,
                      backgroundColor: colors.accent,
                      color: 'white',
                      marginRight: 5,
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.xxs,
                      paddingHorizontal: ph / 2,
                      paddingVertical: pv / 4,
                    }}>
                    {topic}
                  </Text>
                ))}
            </View>
          )}

          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs,
              paddingTop: pv / 2,
            }}>
            {isTopic ? null : (
              <Text
                style={{
                  color: colors.accent,
                }}>
                {new Date(item.dateCreated).toDateString().substring(4)} {'  '}
              </Text>
            )}
            15 notes
          </Text>
        </View>

        {hideMore ? null : (
          <Menu
            style={{
              borderRadius: 5,
            }}
            ref={ref => (setMenuRef[index] = ref)}
            button={
              <TouchableOpacity
                style={{
                  width: w * 0.05,
                  justifyContent: 'center',
                  minHeight: 70,
                  alignItems: 'center',
                }}
                onPress={() => setMenuRef[index].show()}>
                <Icon name="more-vertical" size={SIZE.lg} color={colors.icon} />
              </TouchableOpacity>
            }>
            <MenuItem
              onPress={() => {
                setVisible(true);
                setMenuRef[index].hide();
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
                paddingBottom: 10,
              }}>
              Created on:{' '}
              {new Date(item.dateCreated).toISOString().slice(0, 10)}
            </MenuItem>
          </Menu>
        )}
        {hideMore && isTopic ? (
          <TouchableOpacity
            activeOpacity={opacity}
            onPress={() => {
              NavigationService.navigate('Home');
            }}
            style={{
              borderWidth: 1,
              borderRadius: 5,
              width: '20%',
              paddingHorizontal: ph - 5,
              borderColor: '#f0f0f0',
              paddingVertical: pv,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.accent,
            }}>
            <Text
              style={{
                fontSize: SIZE.xs,
                fontFamily: WEIGHT.semibold,
                color: 'white',
              }}>
              Move
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};
