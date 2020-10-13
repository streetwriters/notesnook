import React, { createRef } from 'react';
import Menu, { MenuDivider, MenuItem } from 'react-native-material-menu';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import { ActionIcon } from '../ActionIcon';
import {SIZE, WEIGHT} from "../../utils/SizeUtils";
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
            backgroundColor: colors.bg,
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
          dispatch({type: Actions.NOTES, sort: null});
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
          dispatch({type: Actions.NOTES, sort: 'abc'});
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
          dispatch({type: Actions.NOTES, sort: 'year'});
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
          dispatch({type: Actions.NOTES, sort: 'month'});
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
          dispatch({type: Actions.NOTES, sort: 'week'});
          menuRef.current?.hide();
        }}>
        By week
      </MenuItem>
    </Menu>
  ) : null;
};
