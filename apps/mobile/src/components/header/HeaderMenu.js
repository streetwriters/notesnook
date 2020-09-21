import React, {createRef} from 'react';
import {TouchableOpacity} from 'react-native';
import Menu, {MenuDivider, MenuItem} from 'react-native-material-menu';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {ActionIcon} from '../ActionIcon';
const menuRef = createRef();
export const HeaderMenu = () => {
  const [state, dispatch] = useTracked();
  const {colors, headerVerticalMenu} = state;

  return headerVerticalMenu ? (
    <Menu
      ref={menuRef}
      animationDuration={200}
      style={{
        borderRadius: 5,
        backgroundColor: colors.bg,
      }}
      button={
        <ActionIcon
          onPress={() => {
            menuRef.current?.show();
          }}
          name="dots-vertical"
          size={SIZE.xl}
          color={colors.pri}
          customStyle={{
            justifyContent: 'center',
            alignItems: 'flex-end',
            height: 40,
            width: 40,
            marginLeft: 10,
            borderRadius: 100,
            backgroundColor: 'white',
          }}
        />
      }>
      <MenuItem
        textStyle={{
          color: colors.icon,
          fontSize: 12,
        }}>
        Sort by:
      </MenuItem>
      <MenuDivider />
      <MenuItem
        textStyle={{
          fontFamily: WEIGHT.regular,
          color: colors.pri,
        }}
        onPress={() => {
          dispatch({type: ACTIONS.NOTES, sort: null});
          menuRef.current?.hide();
        }}>
        Default
      </MenuItem>
      <MenuItem
        textStyle={{
          fontFamily: WEIGHT.regular,
          color: colors.pri,
        }}
        onPress={() => {
          dispatch({type: ACTIONS.NOTES, sort: 'abc'});
          menuRef.current?.hide();
        }}>
        Alphabetical
      </MenuItem>
      <MenuItem
        textStyle={{
          fontFamily: WEIGHT.regular,
          color: colors.pri,
        }}
        onPress={() => {
          dispatch({type: ACTIONS.NOTES, sort: 'year'});
          menuRef.current?.hide();
        }}>
        By year
      </MenuItem>
      <MenuItem
        textStyle={{
          fontFamily: WEIGHT.regular,
          color: colors.pri,
        }}
        onPress={() => {
          dispatch({type: ACTIONS.NOTES, sort: 'month'});
          menuRef.current?.hide();
        }}>
        By month
      </MenuItem>
      <MenuItem
        textStyle={{
          fontFamily: WEIGHT.regular,
          color: colors.pri,
        }}
        onPress={() => {
          dispatch({type: ACTIONS.NOTES, sort: 'week'});
          menuRef.current?.hide();
        }}>
        By week
      </MenuItem>
    </Menu>
  ) : null;
};
