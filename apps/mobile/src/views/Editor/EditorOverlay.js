import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { Easing, timing, useValue } from 'react-native-reanimated';
import { Button } from '../../components/Button';
import Paragraph from '../../components/Typography/Paragraph';
import { useTracked } from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import { SIZE } from '../../utils/SizeUtils';

let timer = null;
let timerError = null;
const EditorOverlay = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const opacity = useValue(1);
  const load = (loading) => {
    clearTimeout(timer);
    clearTimeout(timerError);
    if (loading) {
      setLoading(loading);
      timerError = setTimeout(() => {
        setError(true);
      }, 6000);
    } else {
      setError(false);
      timing(opacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
      }).start(() => {
        setTimeout(() => {
          opacity.setValue(1);
          clearTimeout(timerError);
          setLoading(false);
        }, 300);
      });
    }
  };

  useEffect(() => {
    eSubscribeEvent('loadingNote', load);
    return () => {
      eUnSubscribeEvent('loadingNote', load);
    };
  }, []);

  return (
    loading && (
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: opacity,
        }}>
        <View
          style={{
            width: '80%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.bg,
            borderRadius: 5,
            paddingVertical: 20,
          }}>
          <ActivityIndicator color={colors.accent} size={SIZE.xxxl} />
          <Paragraph size={SIZE.md}>Loading Note</Paragraph>

          {error && (
            <>
              <Button
                type="error"
                style={{
                  marginTop: 10,
                }}
                onPress={() => {
                  eSendEvent('webviewreset');
                }}
                title="Taking too long? Reload Editor"
              />
              <Paragraph
                textBreakStrategy="balanced"
                size={SIZE.xs}
                color={colors.icon}
                style={{
                  textAlign: 'center',
                  maxWidth: '70%',
                  marginTop: 5,
                }}>
                If the editor fails to load even after reloading. Try restarting
                the app.
              </Paragraph>
            </>
          )}
        </View>
      </Animated.View>
    )
  );
};

export default EditorOverlay;
