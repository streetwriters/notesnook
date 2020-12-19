import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {getElevation} from '../../utils';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
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
      type="transparent"
      customStyle={{
        width: '100%',
        alignSelf: 'center',
        borderRadius: 0,
        flexDirection: 'row',
        paddingHorizontal: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 40,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Icon
          style={{
            minWidth: 30,
            textAlignVertical: 'center',
            textAlign: 'left',
          }}
          name={item.icon}
          color={colors.accent}
          size={SIZE.md}
        />
        {headerTextState?.id === item.name.toLowerCase() + '_navigation' ? (
          <Heading color={colors.accent} size={SIZE.md}>
            {item.name}
          </Heading>
        ) : (
          <Paragraph size={SIZE.md}>{item.name}</Paragraph>
        )}
      </View>

      {item.switch ? (
        <Icon
          size={SIZE.lg}
          color={item.on ? colors.accent : colors.icon}
          name={item.on ? 'toggle-switch' : 'toggle-switch-off'}
        />
      ) : (
        <View
          style={{
            backgroundColor:
              headerTextState?.id === item.name.toLowerCase() + '_navigation'
                ? colors.accent
                : 'transparent',
            width: 7,
            height: 7,
            borderRadius: 100,
            ...getElevation(5),
          }}
        />
      )}
    </PressableButton>
  );
};
