import React, { createRef } from 'react';
import { TouchableOpacity } from 'react-native';
import Menu, { MenuDivider, MenuItem } from 'react-native-material-menu';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SIZE, WEIGHT } from '../../common/common';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';
const menuRef = createRef();
export const HeaderMenu = () => {
  const [state, dispatch] = useTracked();
  const {colors, headerVerticalMenu} = state;

  return headerVerticalMenu ? (
    <Menu
      ref={menuRef}
      style={{
        borderRadius: 5,
        backgroundColor: colors.bg,
      }}
      button={
        <TouchableOpacity
          onPress={() => {
            menuRef.current?.show();
          }}
          style={{
            justifyContent: 'center',
            alignItems: 'flex-end',
            height: 40,
            width: 60,
          }}>
          <Icon name="sort" size={SIZE.xl} color={colors.icon} />
        </TouchableOpacity>
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
