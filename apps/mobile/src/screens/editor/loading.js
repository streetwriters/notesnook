import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Button } from '../../components/ui/button';
import Heading from '../../components/ui/typography/heading';
import Paragraph from '../../components/ui/typography/paragraph';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { useThemeStore } from '../../stores/use-theme-store';
import { eOnLoadNote } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { timeConverter } from '../../utils/time';
import { editorState } from './tiptap/utils';

const EditorOverlay = ({ editorId = '', editor }) => {
  const colors = useThemeStore(state => state.colors);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(false);
  const opacity = useSharedValue(1);
  const isDefaultEditor = editorId === '';
  const timers = useRef({
    loading: 0,
    error: 0,
    closing: 0
  });

  const clearTimers = () => {
    clearTimeout(timers.current.loading);
    clearTimeout(timers.current.error);
    clearTimeout(timers.current.closing);
  };

  const load = async _loading => {
    editorState().overlay = true;
    clearTimers();
    if (_loading) {
      opacity.value = 1;
      setLoading(_loading);
      timers.current.error = setTimeout(() => {
        if (_loading) {
          let note = _loading;
          note.forced = true;
          eSendEvent(eOnLoadNote + editorId, note);
        }
        setError(true);
      }, 4000);
    } else {
      clearTimers();
      setError(false);
      editorState().overlay = false;
      setLoading(null);
    }
  };

  useEffect(() => {
    if (!loading) {
      opacity.value = 1;
    }
  }, [loading]);

  useEffect(() => {
    eSubscribeEvent('loadingNote' + editorId, load);
    return () => {
      clearTimers();
      eUnSubscribeEvent('loadingNote' + editorId, load);
    };
  }, [loading, editorId]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
          justifyContent: 'center',
          alignItems: 'center',
          transform: [
            {
              translateY: loading ? 0 : 6000
            }
          ],
          zIndex: 100
        },
        animatedStyle
      ]}
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
        {isDefaultEditor ? (
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
        ) : null}

        {loading?.title ? (
          <Heading
            textBreakStrategy="balanced"
            style={{ textAlign: 'center', marginBottom: 5 }}
            size={SIZE.lg}
          >
            {loading.title}
          </Heading>
        ) : null}

        {loading?.dateEdited && isDefaultEditor ? (
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
              editor.setLoading(true);
              setTimeout(() => editor.setLoading(false), 10);
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
