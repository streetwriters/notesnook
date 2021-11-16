import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {getElevation} from '../../utils';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import ToggleSwitch from 'toggle-switch-react-native';

export const MenuListItem = ({item, index, noTextMode, testID, rightBtn}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [headerTextState, setHeaderTextState] = useState(null);
  let isFocused =
    headerTextState?.id === item.name.toLowerCase() + '_navigation';

  const _onPress = event => {
    if (item.func) {
      item.func();
    } else {
      Navigation.navigate(
        item.name,
        {
          menu: true
        },
        {
          heading: item.name,
          id: item.name.toLowerCase() + '_navigation'
        }
      );
    }
    if (item.close) {
      Navigation.closeDrawer();
    }
  };

  const onHeaderStateChange = event => {
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
      type={!isFocused ? 'gray' : 'grayBg'}
      customStyle={{
        width: '100%',
        alignSelf: 'center',
        borderRadius: 5,
        flexDirection: 'row',
        paddingHorizontal: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
        height: normalize(50),
        marginBottom: 5
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}>
        <Icon
          style={{
            width: 30,
            textAlignVertical: 'center',
            textAlign: 'left'
          }}
          name={item.icon}
          color={
            item.icon === 'crown'
              ? colors.yellow
              : isFocused
              ? colors.accent
              : colors.pri
          }
          size={SIZE.lg - 2}
        />
        {isFocused ? (
          <Heading color={colors.heading} size={SIZE.md}>
            {item.name}
          </Heading>
        ) : (
          <Paragraph size={SIZE.md}>{item.name}</Paragraph>
        )}
      </View>

      {item.switch ? (
        <ToggleSwitch
          isOn={item.on}
          onColor={colors.accent}
          offColor={colors.icon}
          size="small"
          animationSpeed={150}
          onToggle={_onPress}
        />
      ) : rightBtn ? (
        <Button
          title={rightBtn.name}
          type="shade"
          height={30}
          fontSize={SIZE.xs}
          iconSize={SIZE.xs}
          icon={rightBtn.icon}
          style={{
            borderRadius: 100,
            paddingHorizontal: 16
          }}
          onPress={rightBtn.func}
        />
      ) : null}
    </PressableButton>
  );
};
