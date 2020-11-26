import React from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import Navigation from '../../services/Navigation';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Paragraph from '../Typography/Paragraph';

export const MenuListItem = ({item, index, noTextMode, ignore, testID}) => {
  const [state, dispatch] = useTracked();
  const {currentScreen, colors} = state;

  const _onPress = (event) => {
    if (item.func) {
      item.func();
    } else {
      Navigation.navigate(
        item.name,
        {
          menu: true,
        },
        {
          heading: item.name,
          id: item.name.toLowerCase() + '_navigation',
        },
      );
    }
    if (item.close) {
      Navigation.closeDrawer();
    }
  };

  return (
    <PressableButton
      testID={testID}
      key={item.name + index}
      onPress={_onPress}
      color={
        currentScreen === item.name.toLowerCase() ? colors.shade : 'transparent'
      }
      selectedColor={colors.accent}
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={0.12}
      customStyle={{
        width: '100%',
        alignSelf: 'center',
        borderRadius: 0,
        flexDirection: 'row',
        paddingHorizontal: noTextMode ? 0 : 8,
        justifyContent: noTextMode ? 'center' : 'space-between',
        alignItems: 'center',
        height: 50,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Icon
          style={{
            minWidth: noTextMode ? 5 : 35,
            textAlignVertical: 'center',
            textAlign: 'left',
          }}
          name={item.icon}
          color={colors.accent}
          size={DDS.isTab ? SIZE.md + 5 : SIZE.md + 1}
        />
        {noTextMode ? null : <Paragraph size={SIZE.md}>{item.name}</Paragraph>}
      </View>

      {item.switch && !noTextMode ? (
        <Icon
          size={SIZE.lg}
          color={item.on ? colors.accent : colors.icon}
          name={item.on ? 'toggle-switch' : 'toggle-switch-off'}
        />
      ) : undefined}
    </PressableButton>
  );
};
