import React, {useEffect, useState} from 'react';
import {ActivityIndicator, useWindowDimensions, View} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {COLORS_NOTE} from '../../utils/Colors';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const Empty = ({loading = true, placeholderData,absolute}) => {
  const [state] = useTracked();
  const {colors} = state;
  const [headerTextState, setHeaderTextState] = useState(
    Navigation.getHeaderState(),
  );
  const insets = useSafeAreaInsets();
  const {height} = useWindowDimensions();

  const onHeaderStateChange = (event) => {
    if (!event) return;
     setHeaderTextState(event);
  };
  useEffect(() => {
    eSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    return () => {
      eUnSubscribeEvent('onHeaderStateChange', onHeaderStateChange);
    };
  }, []);

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          position: absolute? "absolute" : 'relative',
          zIndex:absolute? 10 : null,
          height: (height - 250) - insets.top,
          width: '100%',
        },
      ]}>
      <View
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Heading>{placeholderData.heading}</Heading>
        <Paragraph
          textBreakStrategy="balanced"
          style={{
            textAlign: 'center',
            width: '80%',
          }}
          color={colors.icon}>
          {loading ? placeholderData.loading : placeholderData.paragraph}
        </Paragraph>
        <Seperator />
        {placeholderData.button && !loading ? (
          <Button
            onPress={placeholderData.action}
            title={placeholderData.button}
            icon="plus"
            type="accent"
            fontSize={SIZE.md}
            accentColor="bg"
            accentText={
              COLORS_NOTE[headerTextState?.heading?.toLowerCase()]
                ? headerTextState.heading?.toLowerCase()
                : 'accent'
            }
          />
        ) : loading ? (
          <ActivityIndicator
            color={
              COLORS_NOTE[headerTextState?.heading?.toLowerCase()]
                ? COLORS_NOTE[headerTextState?.heading?.toLowerCase()]
                : colors.accent
            }
          />
        ) : null}
      </View>
    </View>
  );
};
