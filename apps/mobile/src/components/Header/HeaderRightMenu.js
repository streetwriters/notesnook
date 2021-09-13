import React, {useRef} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import Menu, {MenuItem} from 'react-native-reanimated-material-menu';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {useSettingStore, useUserStore} from '../../provider/stores';
import Navigation from '../../services/Navigation';
import {SIZE} from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import {ActionIcon} from '../ActionIcon';
import {Button} from '../Button';

export const HeaderRightMenu = ({currentScreen, action, rightButtons}) => {
  const [state] = useTracked();
  const {colors} = state;
  const deviceMode = useSettingStore(state => state.deviceMode);
  const menuRef = useRef();
  return (
    <View style={styles.rightBtnContainer}>
      {currentScreen !== 'Settings' && (
        <ActionIcon
          onPress={async () => {
            Navigation.navigate('Search', {
              menu: false
            });
          }}
          testID={notesnook.ids.default.header.buttons.left}
          name="magnify"
          color={colors.pri}
          customStyle={styles.rightBtn}
        />
      )}

      {deviceMode !== 'mobile' ? (
        <Button
          onPress={action}
          testID={notesnook.ids.default.addBtn}
          icon={currentScreen === 'Trash' ? 'delete' : 'plus'}
          iconSize={SIZE.xl}
          type="accent"
          style={{
            marginLeft: 10,
            width: 40,
            height: 40,
            borderRadius: 100,
            paddingHorizontal: 0
          }}
        />
      ) : null}

      {rightButtons && (
        <Menu
          ref={menuRef}
          animationDuration={200}
          style={{
            borderRadius: 5,
            backgroundColor: colors.bg
          }}
          button={
            <ActionIcon
              onPress={() => {
                menuRef.current?.show();
              }}
              testID={notesnook.ids.default.header.buttons.left}
              name="dots-vertical"
              color={colors.pri}
              customStyle={styles.rightBtn}
            />
          }>
          {rightButtons.map((item, index) => (
            <MenuItem
              key={item.title}
              onPress={async () => {
                menuRef.current?.hide();
                await sleep(300);
                item.func();
              }}
              textStyle={{
                fontSize: SIZE.md,
                color: colors.pri
              }}>
              <Icon name={item.icon} size={SIZE.md} />
              {'  ' + item.title}
            </MenuItem>
          ))}
        </Menu>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rightBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rightBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    marginLeft: 10,
    paddingRight: 0
  }
});
