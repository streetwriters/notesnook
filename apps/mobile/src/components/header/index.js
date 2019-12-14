import React, {useEffect, useState} from 'react';
import {View, TouchableOpacity, Platform, Text} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {SIZE, WEIGHT} from '../../common/common';
import {h, SideMenuEvent} from '../../utils/utils';
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
  sendHeight = e => {},
}) => {
  const {colors} = useAppContext();
  const [isOpen, setOpen] = useState(DDS.isTab ? true : false);

  return (
    <Animatable.View
      onLayout={e => {
        if (sendHeight) {
          sendHeight(e.nativeEvent.layout.height);
        }
      }}
      transition={['minHeight', 'marginBottom']}
      duration={250}
      style={{
        minHeight: hide ? 50 : 50,
        flexDirection: 'row',
        zIndex: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: DDS.isTab ? '2.5%' : '5%',
        paddingTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.06,
        marginBottom: hide
          ? h * 0.03
          : Platform.OS == 'ios'
          ? h * 0.04
          : h * 0.04,
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
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              height: 40,
              width: 25,
            }}>
            <Icon
              style={{
                marginLeft: -10,
              }}
              color={colors.pri}
              name={'chevron-left'}
              size={SIZE.xl}
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
                setOpen(false);
              } else {
                SideMenuEvent.open();
                setOpen(true);
              }
            }}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
              height: 40,
              width: 45,
            }}>
            <Icon color={colors.pri} name={'menu'} size={SIZE.xl} />
          </TouchableOpacity>
        ) : (
          undefined
        )}

        <Animatable.Text
          transition="fontSize"
          duration={300}
          style={{
            fontSize: hide ? SIZE.xl : SIZE.xl,
            color: colors.pri,
            fontFamily: WEIGHT.bold,
          }}>
          {heading}
        </Animatable.Text>
      </View>
      <Animatable.View
        transition="opacity"
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
            marginTop: 7,
          }}>
          <Icon name={'search'} size={SIZE.xl} color={colors.icon} />
        </TouchableOpacity>
      </Animatable.View>
    </Animatable.View>
  );
};
