import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Menu from 'react-native-reanimated-material-menu';
import { notesnook } from '../../../e2e/test.ids';
import { useThemeStore } from '../../stores/theme';
import { useSettingStore } from '../../stores/stores';
import Navigation from '../../services/navigation';
import { SIZE } from '../../utils/size';
import { Button } from '../ui/button';
import { IconButton } from '../ui/icon-button';

export const RightMenus = ({ currentScreen, action, rightButtons }) => {
  const colors = useThemeStore(state => state.colors);
  const deviceMode = useSettingStore(state => state.deviceMode);
  const menuRef = useRef();
  return (
    <View style={styles.rightBtnContainer}>
      {currentScreen !== 'Settings' ? (
        <IconButton
          onPress={async () => {
            Navigation.navigate('Search', {
              menu: false
            });
          }}
          name="magnify"
          color={colors.pri}
          customStyle={styles.rightBtn}
        />
      ) : null}

      {deviceMode !== 'mobile' ? (
        <Button
          onPress={action}
          testID={notesnook.ids.default.addBtn}
          icon={currentScreen === 'Trash' ? 'delete' : 'plus'}
          iconSize={SIZE.xl}
          type="shade"
          hitSlop={{
            top: 10,
            right: 10,
            bottom: 10,
            left: 0
          }}
          style={{
            marginLeft: 10,
            width: 32,
            height: 32,
            borderRadius: 5,
            paddingHorizontal: 0,
            borderWidth: 1,
            borderColor: colors.accent
          }}
        />
      ) : null}

      {rightButtons ? (
        <Menu
          ref={menuRef}
          animationDuration={200}
          style={{
            borderRadius: 5,
            backgroundColor: colors.bg
          }}
          button={
            <IconButton
              onPress={() => {
                menuRef.current?.show();
              }}
              //testID={notesnook.ids.default.header.buttons.left}
              name="dots-vertical"
              color={colors.pri}
              customStyle={styles.rightBtn}
            />
          }
        >
          {rightButtons.map((item, index) => (
            <Button
              style={{
                width: 150,
                justifyContent: 'flex-start',
                borderRadius: 0
              }}
              type="gray"
              buttonType={{
                text: colors.pri
              }}
              key={item.title}
              title={item.title}
              onPress={item.func}
            />
          ))}
        </Menu>
      ) : null}
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
