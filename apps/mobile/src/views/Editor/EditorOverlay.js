import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Animated, {Easing, timing, useValue} from 'react-native-reanimated';
import {Button} from '../../components/Button';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import {SIZE} from '../../utils/SizeUtils';
import {sleep, timeConverter} from '../../utils/TimeUtils';

let timer = null;
let timerError = null;
let timerClosing = null;
const EditorOverlay = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(false);
  const opacity = useValue(1);

  const load = async _loading => {
    clearTimeout(timer);
    clearTimeout(timerError);
    clearTimeout(timerClosing);
    if (_loading) {
      opacity.setValue(1);
      setLoading(_loading);
      timerError = setTimeout(() => {
        setError(true);
      }, 4000);
    } else {
      clearTimeout(timer);
      clearTimeout(timerError);
      clearTimeout(timerClosing);
      setError(false);
      timing(opacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.in(Easing.ease)
      }).start();
      timerClosing = setTimeout(() => {
        opacity.setValue(1);
        setLoading(null);
      }, 150);
    }
  };

  useEffect(() => {
    eSubscribeEvent('loadingNote', load);
    return () => {
      eUnSubscribeEvent('loadingNote', load);
    };
  }, [loading]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: opacity,
        transform: [
          {
            translateY: loading ? 0 : 6000
          }
        ],
        zIndex: 100
      }}>
      <View
        style={{
          width: '90%',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg,
          borderRadius: 5,
          paddingVertical: 20
        }}>
        <View
          style={{
            flexDirection: 'row',
            height: 10,
            width: 100,
            marginBottom: 15,
            borderRadius: 5,
            overflow: 'hidden',
            backgroundColor: colors.nav
          }}>
          <Animated.View
            style={{
              height: 10,
              borderRadius: 5,
              width: 100,
              backgroundColor: colors.accent
            }}
          />
        </View>

        <Heading
          textBreakStrategy="balanced"
          style={{textAlign: 'center', marginBottom: 5}}
          size={SIZE.lg}>
          {loading?.title ? loading.title : 'Loading editor'}
        </Heading>

        {loading?.dateEdited ? (
          <Paragraph
            textBreakStrategy="balanced"
            style={{textAlign: 'center'}}
            color={colors.icon}
            size={SIZE.sm}>
            {timeConverter(loading.dateEdited)}
          </Paragraph>
        ) : null}
      </View>

      {error && (
        <View
          style={{
            position: 'absolute',
            bottom: 25
          }}>
          <Button
            type="errorShade"
            style={{
              marginTop: 10
            }}
            onPress={() => {
              setError(false);
              eSendEvent('webviewreset');
            }}
            title="Taking too long? Reload editor"
          />
          <Paragraph
            textBreakStrategy="balanced"
            size={SIZE.xs}
            color={colors.icon}
            style={{
              textAlign: 'center',
              maxWidth: '100%',
              marginTop: 5
            }}>
            If the editor fails to load even after reloading. Try restarting the
            app.
          </Paragraph>
        </View>
      )}
    </Animated.View>
  );
};

export default EditorOverlay;
