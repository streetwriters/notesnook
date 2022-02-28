import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ToggleSwitch from 'toggle-switch-react-native';
import { useTracked } from '../../provider';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { normalize, SIZE } from '../../utils/size';
import { Button } from '../ui/button';
import { PressableButton } from '../ui/pressable';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

export const MenuItem = React.memo(
  ({ item, index, testID, rightBtn }) => {
    const [state] = useTracked();
    const { colors } = state;
    const [headerTextState, setHeaderTextState] = useState(null);
    let isFocused = headerTextState?.id === item.name.toLowerCase() + '_navigation';

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
      setTimeout(() => {
        if (event.id === item.name.toLowerCase() + '_navigation') {
          setHeaderTextState(event);
        } else {
          if (headerTextState !== null) {
            setHeaderTextState(null);
          }
        }
      }, 300);
    };

    useEffect(() => {
      eSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
      return () => {
        eUnSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
      };
    }, [headerTextState]);

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
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <Icon
            style={{
              width: 30,
              textAlignVertical: 'center',
              textAlign: 'left'
            }}
            name={item.icon}
            color={item.icon === 'crown' ? colors.yellow : isFocused ? colors.accent : colors.pri}
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
  },
  (prev, next) => {
    if (prev.item.name !== next.item.name) return false;
    if (prev.rightBtn?.name !== next.rightBtn?.name) return false;
    return true;
  }
);
