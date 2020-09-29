import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SIZE, WEIGHT } from '../../common/common';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';
import { eSendEvent } from '../../services/eventManager';
import { eClearSearch } from '../../services/events';
import NavigationService from '../../services/NavigationService';
import { PressableButton } from '../PressableButton';

export const MenuListItem = ({item, index, noTextMode, ignore,testID}) => {
  const [state, dispatch] = useTracked();
  const {currentScreen, colors} = state;

  const _onPress = () => {
    if (!ignore) {
      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: item.name,
        },
      });
      eSendEvent(eClearSearch);
    }

    item.func();
    if (item.close) {
      NavigationService.closeDrawer();
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
        height:50
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
          size={SIZE.md + 1}
        />
        {noTextMode ? null : (
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.sm,
              color: colors.heading,
            }}>
            {item.name}
          </Text>
        )}
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
