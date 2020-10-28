import React, {createRef} from 'react';
import Menu, {MenuDivider, MenuItem} from 'react-native-material-menu';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {ActionIcon} from '../ActionIcon';
import {SIZE, WEIGHT} from "../../utils/SizeUtils";

const menuRef = createRef();
export const HeaderMenu = () => {
  const [state, dispatch] = useTracked();
  const {colors, headerVerticalMenu} = state;

  const styles = {
      text:{
          fontFamily: WEIGHT.regular,
          color: colors.pri,
          fontSize: SIZE.sm,
      },
      title:{
          fontFamily: WEIGHT.regular,
          color: colors.icon,
          fontSize: SIZE.sm ,
      },
      action:{
        justifyContent: 'center',
        alignItems: 'flex-end',
        height: 40,
        width: 40,
        marginLeft: 10,
        borderRadius: 100,
        backgroundColor: colors.bg,

      }
    }

  return headerVerticalMenu ? (
    <Menu
      ref={menuRef}
      animationDuration={200}
      style={{
        borderRadius: 5,
        backgroundColor: colors.bg,
        paddingBottom:10,
      }}
      button={
        <ActionIcon
          onPress={() => {
            menuRef.current?.show();
          }}
          name="dots-vertical"
          size={SIZE.xl}
          color={colors.pri}
          customStyle={styles.action}
        />
      }>
      <MenuItem
        textStyle={styles.title}>
        Sort by:
      </MenuItem>
      <MenuItem

        textStyle={styles.text}
        onPress={() => {
          dispatch({type: Actions.NOTES, sort: null});
          menuRef.current?.hide();
        }}>
        Default
      </MenuItem>
      <MenuItem
          textStyle={styles.text}

        onPress={() => {
          dispatch({type: Actions.NOTES, sort: 'abc'});
          menuRef.current?.hide();
        }}>
        Alphabetical
      </MenuItem>
        <MenuItem
          textStyle={styles.text}
        onPress={() => {
          dispatch({type: Actions.NOTES, sort: 'year'});
          menuRef.current?.hide();
        }}>
        By year
      </MenuItem>
      <MenuItem
          textStyle={styles.text}
        onPress={() => {
          dispatch({type: Actions.NOTES, sort: 'month'});
          menuRef.current?.hide();
        }}>
        By month
      </MenuItem>
      <MenuItem
          textStyle={styles.text}
        onPress={() => {
          dispatch({type: Actions.NOTES, sort: 'week'});
          menuRef.current?.hide();
        }}>
        By week
      </MenuItem>
    </Menu>
  ) : null;
};
