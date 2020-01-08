import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, Platform, Text, StatusBar} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {SIZE, WEIGHT} from '../../common/common';
import {h, SideMenuEvent, getElevation} from '../../utils/utils';
import * as Animatable from 'react-native-animatable';
import NavigationService from '../../services/NavigationService';
import {DDS} from '../../../App';
import {useAppContext} from '../../provider/useAppContext';
export const Header = ({
  heading,
  canGoBack = true,
  hide,
  showSearch,
  menu,
  verticalMenu = false,
  sendHeight = e => {},
}) => {
  const {colors} = useAppContext();
  let isOpen = false;

  return (
    <Animatable.View
      transition={['minHeight', 'marginBottom']}
      duration={250}
      style={{
        flexDirection: 'row',
        zIndex: 10,
        height: 50,
        marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        marginBottom: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        width: '100%',
      }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
        }}>
        {canGoBack ? (
          <TouchableOpacity
            hitSlop={{top: 20, bottom: 20, left: 50, right: 40}}
            onPress={() => {
              NavigationService.goBack();
            }}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: 40,
              width: 50,
              marginTop: 2.5,
            }}>
            <Icon
              style={{
                marginLeft: -10,
              }}
              color={colors.pri}
              name={'chevron-left'}
              size={SIZE.xxxl - 3}
            />
          </TouchableOpacity>
        ) : (
          undefined
        )}
        {menu ? (
          <TouchableOpacity
            hitSlop={{top: 20, bottom: 20, left: 50, right: 40}}
            onPress={() => {
              if (isOpen) {
                SideMenuEvent.close();
                isOpen = false;
              } else {
                SideMenuEvent.open();
                isOpen = true;
              }
            }}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: 40,
              marginTop: 2.5,
              width: 60,
            }}>
            <Icon color={colors.pri} name={'menu'} size={SIZE.xxxl - 3} />
          </TouchableOpacity>
        ) : (
          undefined
        )}

        <Text
          style={{
            fontSize: SIZE.xl,
            color: colors.pri,
            fontFamily: WEIGHT.bold,
          }}>
          {heading}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Animatable.View
          transition="opacity"
          useNativeDriver={true}
          duration={500}
          style={{
            opacity: hide ? 1 : 0,
          }}>
          <TouchableOpacity
            onPress={() => showSearch()}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-end',
              height: 40,
              width: 60,
              paddingRight: 0,
            }}>
            <Icon name={'search'} size={SIZE.xl} color={colors.icon} />
          </TouchableOpacity>
        </Animatable.View>
        {verticalMenu ? (
          <TouchableOpacity
            style={{
              justifyContent: 'center',
              alignItems: 'flex-end',
              height: 40,
              width: 60,
            }}>
            <Icon
              style={{
                position: 'absolute',
                transform: [
                  {
                    translateX: 0,
                  },
                  {
                    translateY: 5,
                  },
                ],
              }}
              name="arrow-down"
              size={SIZE.lg}
              color={colors.icon}
            />
            <Icon
              style={{
                position: 'absolute',
                transform: [
                  {
                    translateX: -15,
                  },
                  {
                    translateY: -5,
                  },
                ],
              }}
              name="arrow-up"
              size={SIZE.lg}
              color={colors.icon}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </Animatable.View>
  );
};
