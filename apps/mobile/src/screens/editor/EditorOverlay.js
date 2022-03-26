import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { Easing, timing, useValue } from 'react-native-reanimated';
import { Button } from '../../components/ui/button';
import Heading from '../../components/ui/typography/heading';
import Paragraph from '../../components/ui/typography/paragraph';
import { useThemeStore } from '../../stores/theme';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { editing } from '../../utils';
import { eOnLoadNote } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { sleep, timeConverter } from '../../utils/time';
import { editorState } from './tiptap/utils';

let timer = null;
let timerError = null;
let timerClosing = null;
const EditorOverlay = () => {
  const colors = useThemeStore(state => state.colors);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(false);
  const opacity = useValue(1);

  const load = async _loading => {
    editorState().overlay = true;
    clearTimeout(timer);
    clearTimeout(timerError);
    clearTimeout(timerClosing);
    if (_loading) {
      opacity.setValue(1);
      setLoading(_loading);
      timerError = setTimeout(() => {
        if (_loading) {
          console.log('could not load');
          let _n = _loading;
          _n.forced = true;
          eSendEvent(eOnLoadNote, _n);
        }
        setError(true);
      }, 4000);
    } else {
      clearTimeout(timer);
      clearTimeout(timerError);
      clearTimeout(timerClosing);
      setError(false);
      editorState().overlay = false;
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
      }}
    >
      <Animated.View
        style={{
          width: '90%',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg,
          borderRadius: 5,
          paddingVertical: 20
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            height: 10,
            width: 100,
            marginBottom: 15,
            borderRadius: 5,
            overflow: 'hidden',
            backgroundColor: colors.nav
          }}
        >
          <Animated.View
            style={{
              height: 10,
              borderRadius: 5,
              width: 100,
              backgroundColor: colors.accent
            }}
          />
        </View>

        {loading?.title ? (
          <Heading
            textBreakStrategy="balanced"
            style={{ textAlign: 'center', marginBottom: 5 }}
            size={SIZE.lg}
          >
            {loading.title}
          </Heading>
        ) : null}

        {loading?.dateEdited ? (
          <Paragraph
            textBreakStrategy="balanced"
            style={{ textAlign: 'center' }}
            color={colors.icon}
            size={SIZE.sm}
          >
            {timeConverter(loading.dateEdited)}
          </Paragraph>
        ) : null}
      </Animated.View>

      {error && (
        <View
          style={{
            position: 'absolute',
            bottom: 25
          }}
        >
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
            }}
          >
            If the editor fails to load even after reloading. Try restarting the app.
          </Paragraph>
        </View>
      )}
    </Animated.View>
  );
};

export default EditorOverlay;
