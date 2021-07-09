import React, {useEffect} from 'react';
import {View} from 'react-native';
import {useValue} from 'react-native-reanimated';
import {useTracked} from '../../provider';
import {useSettingStore} from '../../provider/stores';
import Heading from '../Typography/Heading';

export const Title = ({heading, headerColor, screen}) => {
  const [state] = useTracked();
  const {colors} = state;
  const deviceMode = useSettingStore(state => state.deviceMode);
  const opacity = useValue(1);

  const onScroll = async data => {
    if (data.screen === 'Settings') return;
    if (data.screen !== screen) return;
    if (deviceMode !== 'mobile') return;
    if (data.y > 75) {
      let yVal = data.y - 75;
      o = yVal / 75;
      opacity.setValue(o);
    } else {
      opacity.setValue(0);
    }
  };

  useEffect(() => {
    //eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      //eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);

  return (
    <View
      style={{
        opacity: 1,
        flexShrink: 1,
        flexDirection: 'row',
      }}>
      <Heading
        numberOfLines={1}
        style={{
          flexWrap: 'wrap',
        }}
        color={headerColor}>
        <Heading color={colors.accent}>
          {heading.slice(0, 1) === '#' ? '#' : null}
        </Heading>
        {heading.slice(0, 1) === '#' ? heading.slice(1) : heading}
      </Heading>
    </View>
  );
};
