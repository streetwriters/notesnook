import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Paragraph from '../Typography/Paragraph';

export const MenuListItem = ({item, index, noTextMode, testID}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [headerTextState, setHeaderTextState] = useState(null);

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

  const onHeaderStateChange = (event) => {
    if (event.id === item.name.toLowerCase() + '_navigation') {
      setHeaderTextState(event);
    } else {
      setHeaderTextState(null);
    }
  };

  useEffect(() => {
    eSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    return () => {
      eUnSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    };
  }, []);

  return (
    <PressableButton
      testID={testID}
      key={item.name + index}
      onPress={_onPress}
      color={
        headerTextState?.id === item.name.toLowerCase() + '_navigation'
          ? colors.shade
          : 'transparent'
      }
      selectedColor={colors.accent}
      alpha={!colors.night ? -0.02 : 0.02}
      opacity={0.12}
      customStyle={{
        width: noTextMode ? 50 : '100%',
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
            minWidth: noTextMode ? null : 35,
            textAlignVertical: 'center',
            textAlign: noTextMode ? 'center' : 'left',
          }}
          name={item.icon}
          color={colors.accent}
          size={SIZE.md}
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
