import React from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import NavigationService from '../../services/Navigation';
import {eClearSearch} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {PressableButton} from '../PressableButton';
import Paragraph from '../Typography/Paragraph';

export const MenuListItem = ({item, index, noTextMode, ignore, testID}) => {
  const [state, dispatch] = useTracked();
  const {currentScreen, colors} = state;

  const _onPress = (event) => {
    if (!ignore && currentScreen !== item.name.toLowerCase()) {
      dispatch({
        type: Actions.HEADER_TEXT_STATE,
        state: {
          heading: item.name,
        },
      });
      eSendEvent(eClearSearch);
    }
    if (item.name.toLowerCase() === currentScreen) {
      console.log('already here');
    }
    if (item.func) {
      item.func();
    } else {
      NavigationService.navigate(item.name);
    }
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
