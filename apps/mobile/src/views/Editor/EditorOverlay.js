import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Animated, {Easing, timing, useValue} from 'react-native-reanimated';
import AnimatedProgress from 'react-native-reanimated-progress-bar';
import {Button} from '../../components/Button';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import {useTracked} from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import {SIZE} from '../../utils/SizeUtils';
import {sleep, timeConverter} from '../../utils/TimeUtils';

let timer = null;
let timerError = null;
const EditorOverlay = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const opacity = useValue(1);

  const load = async (_loading) => {
    clearTimeout(timer);
    clearTimeout(timerError);
    setProgress(2);
    if (_loading) {
      setLoading(_loading);
      timerError = setTimeout(() => {
        setError(true);
      }, 6000);
    } else {
      setProgress(4);
      await sleep(150);
      setError(false);
      timing(opacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.ease),
      }).start(async () => {
        await sleep(150);
        setProgress(1);
        opacity.setValue(1);
        clearTimeout(timerError);
        setLoading(false);
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
    <Animated.View
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: opacity,
        top: loading ? 0 : 6000,
        zIndex: 100,
      }}>
      <View
        style={{
          width: '90%',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg,
          borderRadius: 5,
          paddingVertical: 20,
        }}>
        <View
          style={{
            flexDirection: 'row',
            height: 10,
            width: 100,
            marginBottom: 15,
          }}>
          <AnimatedProgress
            fill={error ? 'red' : colors.accent}
            total={4}
            current={progress}
          />
        </View>

        <Heading
          textBreakStrategy="balanced"
          style={{textAlign: 'center', marginBottom: 5}}
          size={SIZE.lg}>
          {loading?.title ? loading.title : 'Loading Note'}
        </Heading>

        <Paragraph
          textBreakStrategy="balanced"
          style={{textAlign: 'center'}}
          color={colors.icon}
          size={SIZE.sm}>
          {loading && timeConverter(loading.dateEdited)}
        </Paragraph>
      </View>

      {error && (
        <View
          style={{
            position: 'absolute',
            bottom: 25,
          }}>
          <Button
            type="errorShade"
            style={{
              marginTop: 10,
            }}
            onPress={() => {
              setProgress(0);
              setError(false);
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
              maxWidth: '100%',
              marginTop: 5,
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
